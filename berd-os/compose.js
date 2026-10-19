// Assembles berd-os.html from its parts:
//   base <style> (kept from the file) + parts/extra.css + parts/extra2.css
//   parts/body.html with parts/content.js (+ content2.js merged), parts/features.js and parts/blog.js injected
// Usage: node compose.js
const fs = require('fs');
const path = require('path');
const here = __dirname, P = f => path.join(here, 'parts', f);
const file = path.join(here, 'berd-os.html');
const cur = fs.readFileSync(file, 'utf8');

const styleEnd = cur.indexOf('</style>');
let head = cur.slice(0, styleEnd);
const mark = '/* ==== extra (parts/extra.css) ==== */';
if (head.includes(mark)) head = head.slice(0, head.indexOf(mark));
const css = fs.readFileSync(P('extra.css'), 'utf8') + '\n' + fs.readFileSync(P('extra2.css'), 'utf8');

// content: deep-merge content2 into content and serialise back
const evalObj = src => Function('return (' + src.trim() + ')')();
const C = evalObj(fs.readFileSync(P('content.js'), 'utf8'));
const C2 = evalObj(fs.readFileSync(P('content2.js'), 'utf8'));
const merge = (a, b) => { for (const k of Object.keys(b)) { if (b[k] && typeof b[k] === 'object' && !Array.isArray(b[k]) && a[k] && typeof a[k] === 'object') merge(a[k], b[k]); else a[k] = b[k]; } return a; };
merge(C, C2);
for (const l of ['hy', 'ru', 'en']) if (!C[l].ui || !C[l].bot || !C[l].brief || !C[l].calc || !C[l].blog) throw new Error('content missing for ' + l);
const BLOG = evalObj(fs.readFileSync(P('blog.js'), 'utf8'));

let body = fs.readFileSync(P('body.html'), 'utf8');
let features = fs.readFileSync(P('features.js'), 'utf8').replace('/*BLOG*/[]/*/BLOG*/', () => '/*BLOG*/' + JSON.stringify(BLOG) + '/*/BLOG*/');
body = body.replace('/*CONTENT*/null/*/CONTENT*/', () => '/*CONTENT*/' + JSON.stringify(C) + '/*/CONTENT*/');
body = body.replace('/*FEATURES*/', () => features);

fs.writeFileSync(file, head + mark + '\n' + css + '</style>\n\n' + body);
console.log('berd-os.html composed', fs.statSync(file).size, 'bytes');
