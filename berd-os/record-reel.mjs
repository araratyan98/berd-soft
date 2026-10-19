// Records reel.html (served by serve.js) into a 1080×1920 30fps MP4 using headless Edge + CDP virtual time.
// Usage: node record-reel.mjs <outDir>   (needs ffmpeg on PATH)
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const out = process.argv[2] || 'reel-out';
const framesDir = path.join(out, 'frames');
fs.mkdirSync(framesDir, { recursive: true });
for (const f of fs.readdirSync(framesDir)) fs.unlinkSync(path.join(framesDir, f));

const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const PORT = 9333, FPS = 30, SECONDS = 26;
const prof = path.join(out, 'edge-profile');
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--mute-audio', `--remote-debugging-port=${PORT}`, `--user-data-dir=${prof}`, '--window-size=1080,1920', 'about:blank'], { stdio: 'ignore' });

const sleep = ms => new Promise(r => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  try { const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); target = list.find(t => t.type === 'page'); } catch {}
  if (!target) await sleep(200);
}
const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const waiters = [];
ws.addEventListener('message', ev => {
  const m = JSON.parse(ev.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
  else if (m.method) for (const w of waiters.splice(0)) w(m);
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });

await send('Page.enable');
await send('Emulation.setDeviceMetricsOverride', { width: 1080, height: 1920, deviceScaleFactor: 1, mobile: false });
await send('Page.navigate', { url: 'http://localhost:5178/reel.html' });
await sleep(6000); // let fonts and the site load in real time before freezing the clock

// freeze page time, then step it one frame at a time
await send('Emulation.setVirtualTimePolicy', { policy: 'pause' });
await send('Runtime.evaluate', { expression: 'startReel()' });
const total = Math.round(SECONDS * FPS);
for (let f = 0; f < total; f++) {
  await send('Emulation.setVirtualTimePolicy', { policy: 'advance', budget: 1000 / FPS });
  await new Promise(r => { const t = setTimeout(r, 400); waiters.push(m => { if (m.method === 'Emulation.virtualTimeBudgetExpired') { clearTimeout(t); r(); } }); });
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 92 });
  fs.writeFileSync(path.join(framesDir, `f${String(f).padStart(5, '0')}.jpg`), Buffer.from(shot.result.data, 'base64'));
  if (f % 60 === 0) console.log('frame', f, '/', total);
}
ws.close(); edge.kill();

const mp4 = path.join(out, 'berd-soft-reel.mp4');
execFileSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%05d.jpg'), '-c:v', 'libx264', '-preset', 'slow', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
console.log('saved', mp4, fs.statSync(mp4).size, 'bytes');
