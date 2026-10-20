// BERD SOFT admin: a local editor for the portfolio, the site texts, contacts and estimator prices.
// Runs only on this computer (127.0.0.1), saves into berd-os/parts, rebuilds the site, and publishes
// with this computer's own git (commit + push to main → GitHub Pages). No passwords or tokens anywhere.
// Usage: node admin/server.js   (or double-click ADMIN.cmd)  →  http://127.0.0.1:5179
const http = require('http'), fs = require('fs'), path = require('path'), crypto = require('crypto');
const { execFile } = require('child_process');

const ROOT = path.join(__dirname, '..');
const PARTS = path.join(ROOT, 'berd-os', 'parts');
const MEDIA = path.join(ROOT, 'media', 'work');
const arg = n => (process.argv.find(a => a.startsWith('--' + n + '=')) || '').split('=')[1];
const PORT = Number(arg('port') || process.env.ADMIN_PORT || 5179);
const NO_OPEN = process.argv.includes('--no-open') || !!process.env.ADMIN_NO_OPEN;
const TOKEN = crypto.randomBytes(24).toString('hex');   // new every start; only the page served here knows it
const LANGS = ['hy', 'ru', 'en'];
const CATS = ['web', 'app', 'mob', 'bot'];

/* ---------- helpers ---------- */
const readJSON = f => JSON.parse(fs.readFileSync(f, 'utf8'));
const writeJSON = (f, o) => fs.writeFileSync(f, JSON.stringify(o, null, 2) + '\n');
function run(cmd, args, opts = {}) {
  return new Promise(resolve => execFile(cmd, args, { cwd: ROOT, windowsHide: true, maxBuffer: 1 << 24, ...opts },
    (err, stdout, stderr) => resolve({ ok: !err, out: String(stdout || '') + String(stderr || '') })));
}
const git = (...args) => run('git', args);
function send(res, code, body, type = 'application/json; charset=utf-8') {
  res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer' });
  res.end(typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body));
}
function readBody(req, limit = 40 << 20) {
  return new Promise((resolve, reject) => {
    let size = 0; const chunks = [];
    req.on('data', c => { size += c.length; if (size > limit) { reject(new Error('Ֆայլը շատ մեծ է')); req.destroy(); } else chunks.push(c); });
    req.on('end', () => { try { resolve(JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}')); } catch (e) { reject(new Error('Սխալ տվյալներ')); } });
    req.on('error', reject);
  });
}

/* ---------- config (contacts + estimator prices live in body.html's BERD_CONFIG) ---------- */
const BODY = path.join(PARTS, 'body.html');
// the config block is our own trusted source file, so evaluating it is the same as build.js does
function fullConfig() {
  const src = fs.readFileSync(BODY, 'utf8');
  return Function('return (' + src.match(/window\.BERD_CONFIG = window\.BERD_CONFIG \|\| (\{[\s\S]*?\n\});/)[1] + ')')();
}
function readConfig() { const cfg = fullConfig(); return { contacts: cfg.contacts, pricing: cfg.pricing }; }
function writeConfig(next) {
  let src = fs.readFileSync(BODY, 'utf8');
  const start = src.indexOf('window.BERD_CONFIG = window.BERD_CONFIG || {'), end = src.indexOf('\n};', start);
  let block = src.slice(start, end);
  for (const k of ['telegram', 'phone', 'email', 'instagram']) {
    const v = String(next.contacts[k] ?? '').trim();
    if (v.length > 80 || /['\\\n<>]/.test(v)) throw new Error('Սխալ կոնտակտ՝ ' + k);
    block = block.replace(new RegExp('(\\n\\s*' + k + ": ')[^']*(')"), (m, a, b) => a + v + b);
  }
  const pair = a => { if (!Array.isArray(a) || a.length !== 2 || !a.every(n => Number.isFinite(+n) && +n >= 0 && +n < 1e6)) throw new Error('Սխալ գին'); return '[' + a.map(n => Math.round(+n)).join(',') + ']'; };
  for (const g of ['types', 'feats']) {
    const cur = readConfig().pricing[g];
    const line = '{ ' + Object.keys(cur).map(k => k + ':' + pair(next.pricing[g][k])).join(', ') + ' }';
    block = block.replace(new RegExp('(\\n\\s*' + g + ': )\\{[^}]*\\}'), (m, a) => a + line);
  }
  for (const k of ['perPage', 'perLang']) block = block.replace(new RegExp('(\\n\\s*' + k + ': )\\[[^\\]]*\\]'), (m, a) => a + pair(next.pricing[k]));
  fs.writeFileSync(BODY, src.slice(0, start) + block + src.slice(end));
}

/* ---------- validation ---------- */
const ID = /^[a-z0-9][a-z0-9-]{0,40}$/, COLOR = /^#[0-9a-fA-F]{6}$/;
const str = (v, max, name) => { v = String(v ?? '').trim(); if (v.length > max) throw new Error(name + '՝ շատ երկար'); return v; };
function cleanProject(p) {
  if (!ID.test(p.id || '')) throw new Error('Սխալ id՝ ' + p.id);
  const o = { id: p.id, name: str(p.name, 60, 'Անուն'), cat: p.cat };
  if (!o.name) throw new Error('Անունը պարտադիր է');
  if (!CATS.includes(o.cat)) throw new Error('Սխալ կատեգորիա');
  o.url = str(p.url, 120, 'Հասցե');
  o.link = str(p.link, 300, 'Հղում');
  if (o.link && !/^https:\/\/[^\s"'<>]+$/.test(o.link)) throw new Error(o.name + '՝ հղումը պետք է սկսվի https://-ով');
  for (const c of ['c1', 'c2', 'c3']) { if (!COLOR.test(p[c] || '')) throw new Error('Սխալ գույն'); o[c] = p[c]; }
  o.stack = (Array.isArray(p.stack) ? p.stack : []).map(s => str(s, 40, 'Տեխնոլոգիա')).filter(Boolean).slice(0, 8);
  if (!['shot', 'phones'].includes(p.type)) throw new Error('Սխալ նկարի տեսակ');
  o.type = p.type;
  if (o.type === 'shot') {
    o.w = Math.round(+p.w || 1200); o.h = Math.round(+p.h);
    if (!(o.w > 100 && o.w <= 1200 && o.h > 100 && o.h <= 3000)) throw new Error(o.name + '՝ նկար չկա');
  }
  if (p.hidden) o.hidden = true;
  o.text = {};
  for (const l of LANGS) {
    const t = (p.text || {})[l] || {}, r = {};
    for (const [k, max] of [['kind', 80], ['role', 120], ['task', 400], ['sol', 500], ['res', 300], ['name', 60]]) {
      const v = str(t[k], max, k);
      if (v) r[k] = v;
    }
    if (!r.kind || !r.task || !r.sol) throw new Error(o.name + ' (' + l + ')՝ լրացրեք տեսակը, խնդիրը և լուծումը');
    if (Array.isArray(t.stack) && t.stack.some(Boolean)) r.stack = t.stack.map(s => str(s, 40, 'stack')).filter(Boolean).slice(0, 8);
    o.text[l] = r;
  }
  return o;
}
// texts: only existing string values may change (the shape of content.json stays as it is)
function applyTextChanges(content, changes) {
  for (const ch of changes) {
    if (!LANGS.includes(ch.lang) || !Array.isArray(ch.path) || !ch.path.length) throw new Error('Սխալ տեքստ');
    let o = content[ch.lang];
    for (let i = 0; i < ch.path.length - 1; i++) {
      const k = ch.path[i]; if (k === '__proto__' || k === 'constructor' || o == null || typeof o !== 'object' || !(k in o)) throw new Error('Սխալ տեքստ'); o = o[k];
    }
    const last = ch.path[ch.path.length - 1];
    if (o == null || typeof o !== 'object' || typeof o[last] !== 'string' || !(last in o)) throw new Error('Սխալ տեքստ');
    o[last] = str(ch.value, 4000, 'Տեքստ');
  }
}
const IMG = /^[a-z0-9][a-z0-9-]{0,40}(-thumb|-1|-2)?\.webp$/;
function saveImage(name, b64) {
  if (!IMG.test(name)) throw new Error('Սխալ նկարի անուն');
  const buf = Buffer.from(String(b64), 'base64');
  if (buf.length < 64 || buf.length > 6 << 20 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') throw new Error('Նկարը WebP չէ');
  fs.writeFileSync(path.join(MEDIA, name), buf);
}

/* ---------- API ---------- */
let busy = false;
async function gitState() {
  const [st, br, log] = await Promise.all([git('status', '--porcelain'), git('rev-parse', '--abbrev-ref', 'HEAD'), git('log', '-1', '--format=%h %cr · %s')]);
  const ahead = await git('rev-list', '--count', '@{u}..HEAD');
  return { branch: br.out.trim(), changes: st.out.split('\n').filter(Boolean).length, ahead: +ahead.out.trim() || 0, last: log.out.trim() };
}
async function build() {
  const r = await run(process.execPath, ['build.js']);
  if (!r.ok) throw new Error('Կայքը չհավաքվեց.\n' + r.out.slice(-1500));
  return r.out;
}
const api = {
  'GET /api/data': async () => ({
    projects: readJSON(path.join(PARTS, 'projects.json')),
    content: readJSON(path.join(PARTS, 'content.json')),
    config: readConfig(),
    git: await gitState(),
    site: fullConfig().siteUrl,
  }),
  'POST /api/save': async body => {
    const prev = readJSON(path.join(PARTS, 'projects.json'));
    let projects = null;
    if (body.projects) {
      projects = body.projects.map(cleanProject);
      const ids = projects.map(p => p.id);
      if (new Set(ids).size !== ids.length) throw new Error('Երկու աշխատանք նույն id-ով');
    }
    // images first, so a project never points at a missing file
    for (const [name, b64] of Object.entries(body.images || {})) saveImage(name, b64);
    if (projects) {
      for (const p of projects) {
        const need = [p.id + '-thumb.webp'].concat(p.type === 'shot' ? [p.id + '.webp'] : [p.id + '-1.webp', p.id + '-2.webp']);
        for (const f of need) if (!fs.existsSync(path.join(MEDIA, f))) throw new Error(p.name + '՝ նկարը բացակայում է (' + f + ')');
      }
      writeJSON(path.join(PARTS, 'projects.json'), projects);
      // images nobody uses any more go too (a deleted project, or a switch between screenshot and phone screens)
      const needed = new Set(projects.flatMap(p => [p.id + '-thumb.webp'].concat(p.type === 'shot' ? [p.id + '.webp'] : [p.id + '-1.webp', p.id + '-2.webp'])));
      for (const id of new Set(prev.map(p => p.id).concat(projects.map(p => p.id))))
        for (const s of ['', '-thumb', '-1', '-2']) { const f = id + s + '.webp'; if (!needed.has(f) && fs.existsSync(path.join(MEDIA, f))) fs.unlinkSync(path.join(MEDIA, f)); }
    }
    if (body.texts && body.texts.length) {
      const content = readJSON(path.join(PARTS, 'content.json'));
      applyTextChanges(content, body.texts);
      writeJSON(path.join(PARTS, 'content.json'), content);
    }
    if (body.config) writeConfig(body.config);
    const out = await build();
    return { ok: true, build: out.trim().split('\n').pop(), git: await gitState() };
  },
  'POST /api/publish': async body => {
    const msg = str(body.message, 200, 'Նկարագրություն') || 'Admin: site update';
    const steps = [];
    const step = async (name, args) => { const r = await git(...args); steps.push(name + (r.ok ? ' ✓' : ' ✗')); if (!r.ok) throw new Error(name + '.\n' + r.out.slice(-1500)); return r.out; };
    await build();
    await step('Ֆայլերը', ['add', '-A', 'berd-os', 'media', 'index.html', 'ru', 'en', 'blog', 'sitemap.xml', 'robots.txt', '404.html']);
    const staged = await git('diff', '--cached', '--quiet');
    if (!staged.ok) await step('Commit', ['commit', '-m', msg]);
    await step('Թարմացում', ['pull', '--rebase', '--autostash', 'origin', 'main']);
    await step('Push', ['push', 'origin', 'HEAD:main']);
    return { ok: true, steps, git: await gitState() };
  },
  // is the published index.html the same as the one built here?
  'GET /api/live': async () => {
    const site = fullConfig().siteUrl;
    const local = crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT, 'index.html'))).digest('hex');
    const remote = await new Promise(resolve => {
      require('https').get(site + '?nc=' + Date.now(), { headers: { 'Cache-Control': 'no-cache' } }, r => {
        const h = crypto.createHash('md5'); r.on('data', c => h.update(c)); r.on('end', () => resolve(h.digest('hex')));
      }).on('error', () => resolve(''));
    });
    return { live: local === remote, site };
  },
  'POST /api/pull': async () => {
    const r = await git('pull', '--rebase', '--autostash', 'origin', 'main');
    if (!r.ok) throw new Error('git pull.\n' + r.out.slice(-1500));
    await build();
    return { ok: true, out: r.out.trim(), git: await gitState() };
  },
};

/* ---------- static: the admin page, and a preview of the site ---------- */
const TYPES = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.mp4': 'video/mp4' };
function preview(res) {
  let html = fs.readFileSync(path.join(ROOT, 'berd-os', 'berd-os.html'), 'utf8')
    .replace(/ga4: 'G-[A-Z0-9]+'/, "ga4: ''").replace(/clarity: '[a-z0-9]+'/, "clarity: ''");
  html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>' + html + '</body></html>';
  send(res, 200, html, 'text/html; charset=utf-8');
}

const server = http.createServer(async (req, res) => {
  // only this computer: refuse any other Host (blocks DNS-rebinding pages) and cross-site requests
  const host = req.headers.host || '';
  if (host !== '127.0.0.1:' + PORT && host !== 'localhost:' + PORT) return send(res, 403, 'forbidden', 'text/plain');
  const u = new URL(req.url, 'http://' + host), p = decodeURIComponent(u.pathname);
  try {
    if (p === '/' || p === '/index.html') {
      const page = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8').replace('__ADMIN_TOKEN__', TOKEN);
      return send(res, 200, page, 'text/html; charset=utf-8');
    }
    if (p === '/preview' || p === '/preview/') return preview(res);
    if (p.startsWith('/media/')) {
      const root = path.join(ROOT, 'media'), f = path.join(root, path.normalize(p.slice(7)));
      if (f.startsWith(root + path.sep) && fs.existsSync(f) && fs.statSync(f).isFile()) return send(res, 200, fs.readFileSync(f), TYPES[path.extname(f)] || 'application/octet-stream');
      return send(res, 404, 'not found', 'text/plain');
    }
    const fn = api[req.method + ' ' + p];
    if (!fn) return send(res, 404, { error: 'not found' });
    if (req.headers['x-admin-token'] !== TOKEN) return send(res, 403, { error: 'Էջը թարմացրեք (ադմինը վերագործարկվել է)' });
    if (req.method === 'POST' && busy) return send(res, 409, { error: 'Սպասեք, նախորդ գործողությունը դեռ ընթանում է' });
    if (req.method === 'POST') busy = true;
    try { send(res, 200, await fn(req.method === 'POST' ? await readBody(req) : null)); }
    finally { if (req.method === 'POST') busy = false; }
  } catch (e) {
    send(res, 400, { error: e.message || String(e) });
  }
});

server.listen(PORT, '127.0.0.1', async () => {
  const url = 'http://127.0.0.1:' + PORT;
  console.log('\n  BERD SOFT admin  →  ' + url + '\n  (փակել՝ Ctrl+C)\n');
  // two computers: start from the latest published state when nothing is pending here
  const st = await gitState();
  if (!st.changes) { const r = await git('pull', '--ff-only', 'origin', 'main'); console.log('  git pull: ' + (r.ok ? r.out.trim().split('\n').pop() : 'չստացվեց, շարունակում ենք տեղային տարբերակով')); }
  else console.log('  Կան չհրապարակված փոփոխություններ (' + st.changes + ')։');
  if (!NO_OPEN) run(process.platform === 'win32' ? 'cmd' : 'xdg-open', process.platform === 'win32' ? ['/c', 'start', '', url] : [url]);
});
