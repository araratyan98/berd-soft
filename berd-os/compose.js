// Assembles berd-os.html from its parts:
//   base <style> (kept from the file) + parts/extra.css + parts/extra2.css
//   parts/body.html with parts/content.json (texts), parts/projects.json (portfolio), parts/features.js and parts/blog.js injected
// The admin (admin/server.js) edits content.json and projects.json. Usage: node compose.js
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

const LANGS = ['hy', 'ru', 'en'];
const C = JSON.parse(fs.readFileSync(P('content.json'), 'utf8'));
for (const l of LANGS) if (!C[l] || !C[l].ui || !C[l].bot || !C[l].brief || !C[l].calc || !C[l].blog) throw new Error('content missing for ' + l);

// portfolio: visual data goes to PROJ, texts to CONTENT[lang].projects; hidden projects are left out
const VISUAL = ['id', 'name', 'cat', 'url', 'link', 'c1', 'c2', 'c3', 'stack', 'type', 'w', 'h'];
const projects = JSON.parse(fs.readFileSync(P('projects.json'), 'utf8')).filter(p => !p.hidden);
const PROJ = projects.map(p => Object.fromEntries(VISUAL.filter(k => p[k] !== undefined).map(k => [k, p[k]])));
for (const l of LANGS) C[l].projects = Object.fromEntries(projects.map(p => [p.id, p.text[l]]));

const evalObj = src => Function('return (' + src.trim() + ')')();
const BLOG = evalObj(fs.readFileSync(P('blog.js'), 'utf8'));

// function replacers: the content contains `$'`, which breaks string replacements
let body = fs.readFileSync(P('body.html'), 'utf8');
let features = fs.readFileSync(P('features.js'), 'utf8').replace('/*BLOG*/[]/*/BLOG*/', () => '/*BLOG*/' + JSON.stringify(BLOG) + '/*/BLOG*/');
body = body.replace('/*CONTENT*/null/*/CONTENT*/', () => '/*CONTENT*/' + JSON.stringify(C) + '/*/CONTENT*/');
body = body.replace('/*PROJ*/[]/*/PROJ*/', () => '/*PROJ*/' + JSON.stringify(PROJ) + '/*/PROJ*/');
body = body.replace('/*FEATURES*/', () => features);

fs.writeFileSync(file, head + mark + '\n' + css + '</style>\n\n' + body);
console.log('berd-os.html composed', fs.statSync(file).size, 'bytes');
