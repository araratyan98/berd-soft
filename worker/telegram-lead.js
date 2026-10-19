/**
 * BERD SOFT — lead relay + live chat (Cloudflare Worker).
 *
 *  POST /            requests from the site (brief, estimator, chat) → your Telegram
 *  GET  /chat        the site polls here for your replies to a chat (?s=session&after=timestamp)
 *  POST /tg          Telegram webhook: when you Reply to a chat message in Telegram, the reply goes back to the site
 *  GET  /setup       one-time: points the Telegram webhook at /tg (safe to call again)
 *
 * The bot token never reaches the browser: it lives only in this Worker's secrets.
 * Settings (Settings → Variables and Secrets / Bindings):
 *   TELEGRAM_BOT_TOKEN  (secret)  token from @BotFather
 *   TELEGRAM_CHAT_ID    (secret)  your chat id
 *   ALLOWED_ORIGIN      (text)    site origins, comma separated
 *   CHAT                (KV namespace binding)  stores chat replies for 30 days
 */

const MAX_FIELD = 2000;
const TTL = 60 * 60 * 24 * 30;
const recent = new Map();

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    const cors = {
      'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0] || '',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    if (url.pathname === '/tg' && request.method === 'POST') return telegramWebhook(request, env);
    if (url.pathname === '/setup') return setup(url, env);
    if (url.pathname === '/chat' && request.method === 'GET') return poll(url, env, cors);
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, cors);
    if (allowed.length && !allowed.includes(origin)) return json({ ok: false, error: 'origin' }, 403, cors);

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const hits = (recent.get(ip) || []).filter(t => now - t < 60_000);
    if (hits.length >= 8) return json({ ok: false, error: 'rate' }, 429, cors);
    hits.push(now); recent.set(ip, hits);

    let data;
    try { data = await request.json(); } catch { return json({ ok: false, error: 'json' }, 400, cors); }
    if (data.website) return json({ ok: true }, 200, cors); // honeypot

    const clip = v => String(v ?? '').slice(0, MAX_FIELD);
    const lines = [];

    if (data.type === 'system') {
      // status messages for the owner (e.g. deploy reports); optional video hosted on the site itself
      const text = clip(data.message);
      const video = String(data.video || '');
      const okVideo = allowed.some(o => video.startsWith(o + '/'));
      const r = okVideo
        ? await tg(env, 'sendVideo', { chat_id: env.TELEGRAM_CHAT_ID, video, caption: text.slice(0, 1000), parse_mode: 'HTML', supports_streaming: true })
        : await tg(env, 'sendMessage', { chat_id: env.TELEGRAM_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: false });
      return json({ ok: r.ok }, r.ok ? 200 : 502, cors);
    }

    if (data.type === 'brief' || data.type === 'calc') {
      lines.push(data.type === 'calc' ? '🧮 <b>Նոր հաշվարկ</b> · BERD SOFT' : '🧩 <b>Նոր բրիֆ</b> · BERD SOFT');
      for (const [k, v] of Object.entries(data.answers || {})) if (v) lines.push(`<b>${esc(k)}:</b> ${esc(clip(v))}`);
      if (data.comment) lines.push(`<b>Մեկնաբանություն:</b> ${esc(clip(data.comment))}`);
      if (!data.contact) return json({ ok: false, error: 'fields' }, 400, cors);
    } else {
      if (!data.message) return json({ ok: false, error: 'fields' }, 400, cors);
      const live = data.type === 'chat' && data.session && env.CHAT;
      lines.push(live ? '💬 <b>Չատ կայքից</b> · BERD SOFT' : '💬 <b>Նոր հաղորդագրություն</b> · BERD SOFT');
      lines.push(esc(clip(data.message)));
      if (live) { lines.push(''); lines.push('↩️ <i>Պատասխանեք (Reply) այս հաղորդագրությանը, և պատասխանը կհայտնվի կայքի չատում։</i>'); }
    }
    lines.push('');
    lines.push(`👤 <b>${esc(clip(data.name)) || '—'}</b>`);
    lines.push(`📞 ${esc(clip(data.contact)) || '—'}`);
    lines.push(`🌐 ${esc(clip(data.lang))} · ${esc(clip(data.page))}`);
    if (data.type === 'chat' && data.session) lines.push(`#s:${esc(clean(data.session))}`);

    const r = await tg(env, 'sendMessage', { chat_id: env.TELEGRAM_CHAT_ID, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true });
    if (r.ok && data.type === 'chat' && data.session && env.CHAT) {
      const j = await r.json().catch(() => null);
      if (j && j.result) await env.CHAT.put('m:' + j.result.message_id, clean(data.session), { expirationTtl: TTL });
    }
    return json({ ok: r.ok }, r.ok ? 200 : 502, cors);
  },
};

async function poll(url, env, cors) {
  if (!env.CHAT) return json({ ok: false, error: 'no-kv' }, 501, cors);
  const s = clean(url.searchParams.get('s'));
  if (!s) return json({ ok: false }, 400, cors);
  const after = +url.searchParams.get('after') || 0;
  const list = JSON.parse((await env.CHAT.get('c:' + s)) || '[]');
  return json({ ok: true, replies: list.filter(m => m.t > after) }, 200, { ...cors, 'Cache-Control': 'no-store' });
}

async function telegramWebhook(request, env) {
  const expected = await secretFor(env);
  if (request.headers.get('X-Telegram-Bot-Api-Secret-Token') !== expected) return new Response('forbidden', { status: 403 });
  const update = await request.json().catch(() => ({}));
  const msg = update.message;
  if (!msg || !msg.reply_to_message || !msg.text || String(msg.chat.id) !== String(env.TELEGRAM_CHAT_ID)) return new Response('ok');
  const orig = msg.reply_to_message;
  let s = env.CHAT ? await env.CHAT.get('m:' + orig.message_id) : null;
  if (!s) { const m = /#s:([a-z0-9]+)/i.exec(orig.text || ''); s = m && m[1]; }
  if (!s || !env.CHAT) return new Response('ok');
  const key = 'c:' + s;
  const list = JSON.parse((await env.CHAT.get(key)) || '[]');
  list.push({ t: Date.now(), text: msg.text.slice(0, MAX_FIELD) });
  await env.CHAT.put(key, JSON.stringify(list.slice(-50)), { expirationTtl: TTL });
  await tg(env, 'sendMessage', { chat_id: env.TELEGRAM_CHAT_ID, text: '✓ Ուղարկված է կայքի չատ', reply_to_message_id: msg.message_id });
  return new Response('ok');
}

async function setup(url, env) {
  const r = await tg(env, 'setWebhook', { url: url.origin + '/tg', secret_token: await secretFor(env), allowed_updates: ['message'], drop_pending_updates: true });
  const j = await r.json().catch(() => ({}));
  return new Response(JSON.stringify({ webhook: j.ok === true, description: j.description || '', kv: !!env.CHAT }), { headers: { 'Content-Type': 'application/json' } });
}

/* webhook secret derived from the bot token, so no extra secret has to be configured */
async function secretFor(env) {
  const d = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('berd-webhook:' + env.TELEGRAM_BOT_TOKEN));
  return [...new Uint8Array(d)].map(b => b.toString(16).padStart(2, '0')).join('').slice(0, 48);
}
function tg(env, method, body) {
  return fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
}
function clean(s) { return String(s || '').replace(/[^a-z0-9]/gi, '').slice(0, 40); }
function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}
