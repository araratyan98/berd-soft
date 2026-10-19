/**
 * BERD SOFT — lead relay (Cloudflare Worker).
 * Receives requests from the website forms and forwards them to your Telegram chat.
 * The bot token never reaches the browser: it lives only in this Worker's secrets.
 *
 * Secrets / variables to set in Cloudflare (Settings → Variables and Secrets):
 *   TELEGRAM_BOT_TOKEN  (secret)  token from @BotFather, e.g. 123456:ABC-...
 *   TELEGRAM_CHAT_ID    (secret)  your chat id (or a group id) where requests should arrive
 *   ALLOWED_ORIGIN      (text)    https://araratyan98.github.io   (add your own domain later, comma separated)
 */

const MAX_FIELD = 2000;
const recent = new Map(); // simple per-IP rate limit for one Worker instance

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowed = (env.ALLOWED_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean);
    const corsOrigin = allowed.includes(origin) ? origin : allowed[0] || '';
    const cors = {
      'Access-Control-Allow-Origin': corsOrigin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Vary': 'Origin',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (request.method !== 'POST') return json({ ok: false, error: 'method' }, 405, cors);
    if (allowed.length && !allowed.includes(origin)) return json({ ok: false, error: 'origin' }, 403, cors);

    // at most 5 requests per minute from one address
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const now = Date.now();
    const hits = (recent.get(ip) || []).filter(t => now - t < 60_000);
    if (hits.length >= 5) return json({ ok: false, error: 'rate' }, 429, cors);
    hits.push(now); recent.set(ip, hits);

    let data;
    try { data = await request.json(); } catch { return json({ ok: false, error: 'json' }, 400, cors); }
    if (data.website) return json({ ok: true }, 200, cors); // honeypot filled → silently ignore bots

    const clip = v => String(v ?? '').slice(0, MAX_FIELD);
    const lines = [];
    if (data.type === 'brief') {
      lines.push('🧩 <b>Նոր բրիֆ</b> · BERD SOFT');
      for (const [k, v] of Object.entries(data.answers || {})) if (v) lines.push(`<b>${esc(k)}:</b> ${esc(clip(v))}`);
      if (data.comment) lines.push(`<b>Մեկնաբանություն:</b> ${esc(clip(data.comment))}`);
    } else {
      lines.push('💬 <b>Նոր հաղորդագրություն</b> · BERD SOFT');
      lines.push(esc(clip(data.message)));
    }
    lines.push('');
    lines.push(`👤 <b>${esc(clip(data.name)) || '—'}</b>`);
    lines.push(`📞 ${esc(clip(data.contact)) || '—'}`);
    lines.push(`🌐 ${esc(clip(data.lang))} · ${esc(clip(data.page))}`);

    if (!data.contact || (!data.message && data.type !== 'brief')) return json({ ok: false, error: 'fields' }, 400, cors);

    const tg = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines.join('\n'), parse_mode: 'HTML', disable_web_page_preview: true }),
    });
    return json({ ok: tg.ok }, tg.ok ? 200 : 502, cors);
  },
};

function esc(s) { return String(s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c])); }
function json(obj, status, headers) {
  return new Response(JSON.stringify(obj), { status, headers: { ...headers, 'Content-Type': 'application/json' } });
}
