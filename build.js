// Builds index.html for GitHub Pages from the prototype source (../berd-os/berd-os.html).
// Usage: node build.js
const fs = require('fs');
const path = require('path');
const src = fs.readFileSync(path.join(__dirname, '..', 'berd-os', 'berd-os.html'), 'utf8');

const head = `<!doctype html>
<html lang="hy">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>BERD SOFT · Թվային բերդ ձեր բիզնեսի համար</title>
<meta name="description" content="BERD SOFT՝ կայքեր, վեբ և մոբայլ հավելվածներ, Telegram-բոտեր։ Երևան։">
<meta property="og:title" content="BERD SOFT · Թվային բերդ ձեր բիզնեսի համար">
<meta property="og:description" content="Կայքեր, հավելվածներ և Telegram-բոտեր, որոնք ամուր են, արագ և աշխատում են ձեզ համար։">
<meta name="theme-color" content="#0b0c10">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect x='2' y='2' width='13' height='13' fill='%231B36F5'/%3E%3Crect x='17' y='2' width='13' height='13' fill='%23CCFF00'/%3E%3Crect x='2' y='17' width='13' height='13' fill='%23E01060'/%3E%3Crect x='17' y='17' width='13' height='13' fill='%23FFB800'/%3E%3C/svg%3E">
<style>
html{box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
body{margin:0;font:14px system-ui,sans-serif}
img{max-width:100%}
[hidden]{display:none!important}
</style>
`;

let body = src
  .replace(/^<title>[^<]*<\/title>\s*/, '')
  .replace(/<meta name="claude:viewport-fit-sides"[^>]*>\s*/, '');
const links = (body.match(/<link[^>]*>\s*/g) || []).join('');
body = body.replace(/<link[^>]*>\s*/g, '');
const styleMatch = body.match(/<style>[\s\S]*?<\/style>\s*/);
const style = styleMatch ? styleMatch[0] : '';
body = body.replace(style, '');

fs.writeFileSync(path.join(__dirname, 'index.html'),
  head + links + style + '</head>\n<body>\n' + body.trim() + '\n</body>\n</html>\n');
console.log('index.html built');
