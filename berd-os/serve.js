// Tiny static server for local testing: serves berd-os.html at / with analytics IDs stripped.
// Usage: node serve.js  (port 5178)
const http = require('http'), fs = require('fs'), path = require('path');
const port = 5178;
http.createServer((req, res) => {
  const p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/' || p === '/index.html') {
    let html = fs.readFileSync(path.join(__dirname, 'berd-os.html'), 'utf8')
      .replace(/ga4: 'G-[A-Z0-9]+'/, "ga4: ''").replace(/clarity: '[a-z0-9]+'/, "clarity: ''");
    html = '<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><style>body{margin:0}[hidden]{display:none!important}</style></head><body>' + html + '</body></html>';
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    return res.end(html);
  }
  if (p === '/reel.html') { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' }); return res.end(fs.readFileSync(path.join(__dirname, 'reel.html'))); }
  // portfolio images and other files under /media/ (same paths as on GitHub Pages)
  if (p.startsWith('/media/')) {
    const root = path.join(__dirname, '..', 'media'), f = path.join(root, path.normalize(p.slice('/media/'.length)));
    const types = { '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp4': 'video/mp4' };
    if (f.startsWith(root + path.sep) && fs.existsSync(f) && fs.statSync(f).isFile()) {
      res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      return fs.createReadStream(f).pipe(res);
    }
  }
  res.writeHead(404); res.end('not found');
}).listen(port, () => console.log('http://localhost:' + port));
