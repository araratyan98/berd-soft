// Builds the GitHub Pages site from the prototype source (berd-os/berd-os.html, composed first from berd-os/parts):
//   index.html (Armenian), ru/index.html, en/index.html, sitemap.xml, robots.txt, 404.html
// Each page gets its own <title>, description, canonical, hreflang links, Open Graph tags,
// JSON-LD (ProfessionalService + FAQ) and a readable text version of the content for search engines
// and screen readers. Usage: node build.js
const fs = require('fs');
const path = require('path');

require('./berd-os/compose.js');
const SRC = path.join(__dirname, 'berd-os', 'berd-os.html');
const OUT = __dirname;
const src = fs.readFileSync(SRC, 'utf8');

// settings + content come from the source page itself, so there is one place to edit
const cfgMatch = src.match(/window\.BERD_CONFIG = window\.BERD_CONFIG \|\| (\{[\s\S]*?\n\});/);
const CFG = Function('return (' + cfgMatch[1] + ')')();
const contentMatch = src.match(/\/\*CONTENT\*\/([\s\S]*?)\/\*\/CONTENT\*\//);
const C = Function('return (' + contentMatch[1] + ')')();
// portfolio names and public links come from PROJ in the page script
const PROJ = Function('return ' + src.match(/var PROJ = (\[[\s\S]*?\n\]);/)[1])();
const projOf = id => PROJ.find(p => p.id === id) || { name: id };
const SITE = CFG.siteUrl.replace(/\/?$/, '/');
const LANGS = ['hy', 'ru', 'en'];
const url = l => SITE + (l === 'hy' ? '' : l + '/');
const ogLocale = { hy: 'hy_AM', ru: 'ru_RU', en: 'en_US' };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const strip = s => String(s ?? '').replace(/<[^>]+>/g, '');

// split the prototype into its pieces
let body = src.replace(/^<title>[^<]*<\/title>\s*/, '').replace(/<meta name="claude:viewport-fit-sides"[^>]*>\s*/, '');
const links = (body.match(/<link[^>]*>\s*/g) || []).join('');
body = body.replace(/<link[^>]*>\s*/g, '');
const style = (body.match(/<style>[\s\S]*?<\/style>\s*/) || [''])[0];
body = body.replace(style, '').trim();

function contacts() {
  const c = CFG.contacts || {}, out = [];
  if (c.telegram) out.push(['https://t.me/' + c.telegram, 'Telegram @' + c.telegram]);
  if (c.phone) out.push(['tel:' + c.phone.replace(/[^+\d]/g, ''), c.phone]);
  if (c.email) out.push(['mailto:' + c.email, c.email]);
  if (c.instagram) out.push(['https://instagram.com/' + c.instagram, 'Instagram @' + c.instagram]);
  return out;
}

function jsonLd(l) {
  const t = C[l], c = CFG.contacts || {};
  const org = {
    '@context': 'https://schema.org', '@type': 'ProfessionalService', '@id': SITE + '#org',
    name: 'BERD SOFT', url: url(l), description: t.meta.desc, image: SITE + 'og-' + l + '.png',
    areaServed: ['AM', 'RU', 'GE', 'EU'], knowsLanguage: ['hy', 'ru', 'en'],
    address: { '@type': 'PostalAddress', addressLocality: l === 'hy' ? 'Երևան' : l === 'ru' ? 'Ереван' : 'Yerevan', addressCountry: 'AM' },
    hasOfferCatalog: { '@type': 'OfferCatalog', name: t.services.title,
      itemListElement: t.services.items.map(s => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: s[0], description: s[1] } })) },
  };
  if (c.email) org.email = c.email;
  if (c.phone) org.telephone = c.phone;
  const same = [c.telegram && 'https://t.me/' + c.telegram, c.instagram && 'https://instagram.com/' + c.instagram].filter(Boolean);
  if (same.length) org.sameAs = same;
  const faq = { '@context': 'https://schema.org', '@type': 'FAQPage',
    mainEntity: t.bot.qa.map(q => ({ '@type': 'Question', name: q[1], acceptedAnswer: { '@type': 'Answer', text: q[2] } })) };
  return [org, faq].map(o => '<script type="application/ld+json">' + JSON.stringify(o).replace(/</g, '\\u003c') + '</script>').join('\n');
}

// the same content visitors open in the windows, as plain HTML for crawlers and screen readers
function readable(l) {
  const t = C[l];
  const h = [];
  h.push('<section class="sr-only" id="site-text" lang="' + l + '">');
  h.push('<h1>BERD SOFT — ' + esc(strip(t.hero.h1)) + '</h1><p>' + esc(t.hero.p) + '</p>');
  h.push('<h2>' + esc(t.services.title) + '</h2><p>' + esc(t.services.lead) + '</p><ul>' + t.services.items.map(s => '<li><strong>' + esc(s[0]) + '.</strong> ' + esc(s[1]) + '</li>').join('') + '</ul>');
  h.push('<h2>' + esc(t.ui.apps.work) + '</h2><ul>' + Object.entries(t.projects).map(([id, p]) => { const pr = projOf(id);
    return '<li><a href="' + url(l) + '#p-' + id + '">' + esc(p.name || pr.name) + '</a> — ' + esc(p.kind) + '. ' + esc(p.task) + ' ' + esc(p.sol) +
      (pr.link ? ' <a href="' + esc(pr.link) + '" rel="noopener">' + esc(pr.url) + '</a>' : '') + '</li>'; }).join('') + '</ul>');
  h.push('<h2>' + esc(t.process.title) + '</h2><ol>' + t.process.steps.map(s => '<li><strong>' + esc(s[0]) + '</strong> (' + esc(s[2]) + '). ' + esc(s[1]) + '</li>').join('') + '</ol>');
  h.push('<h2>' + esc(t.about.title) + '</h2><p>' + esc(t.about.lead) + '</p><ul>' + t.about.gua.map(g => '<li><strong>' + esc(g[0]) + '.</strong> ' + esc(g[1]) + '</li>').join('') + '</ul>');
  h.push('<h2>FAQ</h2><dl>' + t.bot.qa.map(q => '<dt>' + esc(q[1]) + '</dt><dd>' + esc(q[2]) + '</dd>').join('') + '</dl>');
  const cs = contacts();
  if (cs.length) h.push('<h2>' + esc(t.about.contacts) + '</h2><ul>' + cs.map(x => '<li><a href="' + esc(x[0]) + '">' + esc(x[1]) + '</a></li>').join('') + '</ul>');
  h.push('<nav aria-label="' + esc(t.ui.lang) + '">' + LANGS.map(x => '<a href="' + url(x) + '" hreflang="' + x + '" lang="' + x + '">' + esc(C[x].name) + '</a>').join(' · ') + '</nav>');
  h.push('</section>');
  return h.join('\n');
}

function page(l) {
  const t = C[l];
  const head = `<!doctype html>
<html lang="${l}" data-lang="${l}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${esc(t.meta.title)}</title>
<meta name="description" content="${esc(t.meta.desc)}">
<link rel="canonical" href="${url(l)}">
${LANGS.map(x => `<link rel="alternate" hreflang="${x}" href="${url(x)}">`).join('\n')}
<link rel="alternate" hreflang="x-default" href="${url('hy')}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="BERD SOFT">
<meta property="og:url" content="${url(l)}">
<meta property="og:title" content="${esc(t.meta.title)}">
<meta property="og:description" content="${esc(t.meta.desc)}">
<meta property="og:image" content="${SITE}og-${l}.png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(t.meta.ogAlt)}">
<meta property="og:locale" content="${ogLocale[l]}">
${LANGS.filter(x => x !== l).map(x => `<meta property="og:locale:alternate" content="${ogLocale[x]}">`).join('\n')}
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(t.meta.title)}">
<meta name="twitter:description" content="${esc(t.meta.desc)}">
<meta name="twitter:image" content="${SITE}og-${l}.png">
<meta name="theme-color" content="#0b0c10">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='2' y='2' width='13' height='13' fill='%231B36F5'/%3E%3Crect x='17' y='2' width='13' height='13' fill='%23CCFF00'/%3E%3Crect x='2' y='17' width='13' height='13' fill='%23E01060'/%3E%3Crect x='17' y='17' width='13' height='13' fill='%23FFB800'/%3E%3C/svg%3E">
<style>
html{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0;font:14px system-ui,sans-serif}
img{max-width:100%}
[hidden]{display:none!important}
</style>
${jsonLd(l)}
`;
  return head + links + style + '</head>\n<body>\n' + readable(l) + '\n<noscript><p style="color:#fff;padding:24px;font:16px sans-serif">' + esc(t.ui.noscript) + '</p></noscript>\n' + body + '\n</body>\n</html>\n';
}

for (const l of LANGS) {
  const dir = l === 'hy' ? OUT : path.join(OUT, l);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), page(l));
}

const today = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(OUT, 'sitemap.xml'),
  '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n' +
  LANGS.map(l => `  <url>\n    <loc>${url(l)}</loc>\n    <lastmod>${today}</lastmod>\n` +
    LANGS.map(x => `    <xhtml:link rel="alternate" hreflang="${x}" href="${url(x)}"/>`).join('\n') + '\n  </url>').join('\n') + '\n</urlset>\n');
fs.writeFileSync(path.join(OUT, 'robots.txt'), `User-agent: *\nAllow: /\nDisallow: /worker/\nDisallow: /tools/\n\nSitemap: ${SITE}sitemap.xml\n`);
fs.writeFileSync(path.join(OUT, '404.html'), `<!doctype html><html lang="hy"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BERD SOFT</title><meta http-equiv="refresh" content="0;url=${SITE}"></head><body style="background:#0b0c10;color:#fff;font:16px system-ui;padding:24px"><a href="${SITE}" style="color:#CCFF00">BERD SOFT →</a></body></html>\n`);
console.log('built:', LANGS.map(l => (l === 'hy' ? '' : l + '/') + 'index.html').join(', '), '+ sitemap.xml, robots.txt, 404.html');

require('./build-blog')({ src, OUT, C, CFG, SITE, LANGS, url, esc });
