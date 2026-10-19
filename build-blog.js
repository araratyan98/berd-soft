// Blog: static article pages + index per language (for Google and sharing).
// Called from build.js with the shared context.
const fs = require('fs');
const path = require('path');

module.exports = function buildBlog({ src, OUT, C, CFG, SITE, LANGS, url, esc }) {
  const blogMatch = src.match(/\/\*BLOG\*\/([\s\S]*?)\/\*\/BLOG\*\//);
  const BLOG = blogMatch ? JSON.parse(blogMatch[1]) : [];
  const blogUrl = (l, slug) => url(l) + 'blog/' + (slug ? slug + '/' : '');
  const fmtDate = d => d.split('-').reverse().join('.');
  const CSS = [
    ':root{--ink:#0D0D0F;--muted:#5f6370;--line:#e3e5ec;--blue:#1B36F5;--lime:#CCFF00;--pink:#E01060;--amber:#FFB800;--bg:#fbfbfd}',
    '*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--ink);font:400 17px/1.7 "Noto Sans Armenian","Onest",system-ui,sans-serif;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}',
    'a{color:var(--blue)}header,main,footer{max-width:720px;margin:0 auto}',
    'header{display:flex;justify-content:space-between;align-items:center;gap:12px;padding-block:22px;border-bottom:1px solid var(--line)}',
    '.brand{display:flex;align-items:center;gap:10px;font:800 18px "Onest",sans-serif;color:var(--ink);text-decoration:none}',
    '.mk{display:grid;grid-template-columns:1fr 1fr;gap:2px;width:22px;height:22px}.mk i:nth-child(1){background:var(--blue)}.mk i:nth-child(2){background:var(--lime)}.mk i:nth-child(3){background:var(--pink)}.mk i:nth-child(4){background:var(--amber)}',
    'nav.langs{display:flex;gap:10px;font:600 14px "Onest",sans-serif}nav.langs a{text-decoration:none;color:var(--muted)}nav.langs a[aria-current]{color:var(--ink)}',
    'main{padding-block:34px 20px}.meta{display:flex;align-items:center;gap:8px;font:600 13px "Onest",sans-serif;color:var(--muted)}.meta i{width:12px;height:12px;border-radius:3px}',
    'h1{margin:12px 0 0;font:800 clamp(28px,5vw,40px)/1.15 "Noto Sans Armenian","Onest",sans-serif;letter-spacing:-.01em;text-wrap:balance}',
    '.lead{font-size:19px;color:#3d404a;margin:14px 0 26px}h2{margin:34px 0 8px;font:800 22px/1.3 "Noto Sans Armenian","Onest",sans-serif}',
    'ul{padding-left:22px}.cta{margin:40px 0 0;padding:24px;border-radius:18px;background:#121318;color:#fff;display:grid;gap:12px}',
    '.cta b{font:800 20px/1.3 "Noto Sans Armenian","Onest",sans-serif}.cta div{display:flex;flex-wrap:wrap;gap:10px}',
    '.cta a{display:inline-block;padding:11px 18px;border-radius:10px;font:700 15px "Noto Sans Armenian","Onest",sans-serif;text-decoration:none}',
    '.cta a.p{background:var(--lime);color:#111}.cta a.g{background:#262938;color:#fff}',
    '.list{display:grid;gap:14px;margin-top:24px}.card{display:grid;gap:6px;padding:20px;border-radius:16px;background:#fff;border:1px solid var(--line);text-decoration:none;color:inherit;border-top:5px solid}',
    '.card b{font:800 20px/1.3 "Noto Sans Armenian","Onest",sans-serif}.card span{color:var(--muted);font-size:15px;line-height:1.55}',
    'footer{padding-block:30px 40px;color:var(--muted);font-size:14px;border-top:1px solid var(--line);margin-top:40px}'
  ].join('\n');
  const CTA = {
    hy: ['Պատրաստ ե՞ք սկսել ձեր նախագիծը', 'Հաշվարկել գինը', 'Բացել BERD SOFT կայքը', 'Բոլոր հոդվածները'],
    ru: ['Готовы начать свой проект?', 'Рассчитать стоимость', 'Открыть сайт BERD SOFT', 'Все статьи'],
    en: ['Ready to start your project?', 'Estimate the price', 'Open the BERD SOFT site', 'All articles'],
  };
  const A = CFG.analytics || {};
  const analytics = l =>
    (A.ga4 ? '<script async src="https://www.googletagmanager.com/gtag/js?id=' + A.ga4 + '"></script><script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag("js",new Date());gtag("config","' + A.ga4 + '",{anonymize_ip:true,site_language:"' + l + '"});</script>' : '') +
    (A.clarity ? '<script>(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y)})(window,document,"clarity","script","' + A.clarity + '");</script>' : '');
  const icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='2' y='2' width='13' height='13' fill='%231B36F5'/%3E%3Crect x='17' y='2' width='13' height='13' fill='%23CCFF00'/%3E%3Crect x='2' y='17' width='13' height='13' fill='%23E01060'/%3E%3Crect x='17' y='17' width='13' height='13' fill='%23FFB800'/%3E%3C/svg%3E";

  function shell(l, title, desc, canon, alts, inner, ld) {
    const langs = alts.filter(a => a[0] !== 'x-default').map(([x, u]) => '<a href="' + u + '" hreflang="' + x + '"' + (x === l ? ' aria-current="page"' : '') + '>' + (x === 'hy' ? 'ՀՅ' : x.toUpperCase()) + '</a>').join('');
    return '<!doctype html><html lang="' + l + '"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' +
      '<title>' + esc(title) + '</title><meta name="description" content="' + esc(desc) + '"><link rel="canonical" href="' + canon + '">\n' +
      alts.map(([x, u]) => '<link rel="alternate" hreflang="' + x + '" href="' + u + '">').join('\n') + '\n' +
      '<meta property="og:type" content="article"><meta property="og:site_name" content="BERD SOFT"><meta property="og:title" content="' + esc(title) + '"><meta property="og:description" content="' + esc(desc) + '"><meta property="og:url" content="' + canon + '"><meta property="og:image" content="' + SITE + 'og-' + l + '.png"><meta name="twitter:card" content="summary_large_image">\n' +
      '<link rel="icon" href="' + icon + '"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Noto+Sans+Armenian:wght@400;600;800&family=Onest:wght@400;600;800&display=swap">\n' +
      '<style>' + CSS + '</style>' + (ld ? '<script type="application/ld+json">' + JSON.stringify(ld).replace(/</g, '\\u003c') + '</script>' : '') + analytics(l) + '\n' +
      '</head><body><header><a class="brand" href="' + url(l) + '"><span class="mk"><i></i><i></i><i></i><i></i></span>BERD SOFT</a><nav class="langs">' + langs + '</nav></header>\n' +
      '<main>' + inner + '<section class="cta"><b>' + esc(CTA[l][0]) + '</b><div><a class="p" href="' + url(l) + '#calc">' + esc(CTA[l][1]) + ' →</a><a class="g" href="' + url(l) + '">' + esc(CTA[l][2]) + '</a></div></section></main>\n' +
      '<footer>© ' + new Date().getFullYear() + ' BERD SOFT · <a href="' + blogUrl(l) + '">' + esc(CTA[l][3]) + '</a></footer></body></html>\n';
  }

  for (const l of LANGS) {
    const base = l === 'hy' ? OUT : path.join(OUT, l);
    const alts = LANGS.map(x => [x, blogUrl(x)]).concat([['x-default', blogUrl('hy')]]);
    const list = '<h1>' + esc(C[l].blog.title) + '</h1><p class="lead">' + esc(C[l].blog.sub) + '</p><div class="list">' +
      BLOG.map(a => '<a class="card" style="border-top-color:' + a.color + '" href="' + blogUrl(l, a.slug) + '"><span class="meta">' + fmtDate(a.date) + ' · ' + a.read + ' ' + esc(C[l].blog.min) + '</span><b>' + esc(a[l].title) + '</b><span>' + esc(a[l].desc) + '</span></a>').join('') + '</div>';
    fs.mkdirSync(path.join(base, 'blog'), { recursive: true });
    fs.writeFileSync(path.join(base, 'blog', 'index.html'), shell(l, C[l].blog.title + ' · BERD SOFT', C[l].blog.sub, blogUrl(l), alts, list,
      { '@context': 'https://schema.org', '@type': 'Blog', name: 'BERD SOFT ' + C[l].blog.title, url: blogUrl(l), inLanguage: l }));
    for (const a of BLOG) {
      const x = a[l], canon = blogUrl(l, a.slug);
      const aAlts = LANGS.map(y => [y, blogUrl(y, a.slug)]).concat([['x-default', blogUrl('hy', a.slug)]]);
      const inner = '<article><span class="meta"><i style="background:' + a.color + '"></i>' + fmtDate(a.date) + ' · ' + a.read + ' ' + esc(C[l].blog.min) + '</span><h1>' + esc(x.title) + '</h1><p class="lead">' + esc(x.desc) + '</p>' + x.body + '</article>';
      fs.mkdirSync(path.join(base, 'blog', a.slug), { recursive: true });
      fs.writeFileSync(path.join(base, 'blog', a.slug, 'index.html'), shell(l, x.title + ' · BERD SOFT', x.desc, canon, aAlts, inner,
        { '@context': 'https://schema.org', '@type': 'BlogPosting', headline: x.title, description: x.desc, datePublished: a.date, inLanguage: l, mainEntityOfPage: canon,
          image: SITE + 'og-' + l + '.png', author: { '@type': 'Organization', name: 'BERD SOFT', url: SITE }, publisher: { '@type': 'Organization', name: 'BERD SOFT', url: SITE } }));
    }
  }

  // sitemap: blog index + articles, each with hreflang alternates
  const today = new Date().toISOString().slice(0, 10);
  const entry = (u, alts) => '  <url>\n    <loc>' + u + '</loc>\n    <lastmod>' + today + '</lastmod>\n' + alts.map(([x, h]) => '    <xhtml:link rel="alternate" hreflang="' + x + '" href="' + h + '"/>').join('\n') + '\n  </url>';
  const extra = [];
  for (const l of LANGS) {
    extra.push(entry(blogUrl(l), LANGS.map(x => [x, blogUrl(x)])));
    for (const a of BLOG) extra.push(entry(blogUrl(l, a.slug), LANGS.map(x => [x, blogUrl(x, a.slug)])));
  }
  const sm = path.join(OUT, 'sitemap.xml');
  fs.writeFileSync(sm, fs.readFileSync(sm, 'utf8').replace('</urlset>', () => extra.join('\n') + '\n</urlset>'));
  console.log('blog:', BLOG.length, 'articles ×', LANGS.length, 'languages');
};
