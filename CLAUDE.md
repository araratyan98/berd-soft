# BERD SOFT site

Studio website in the style of a laptop "OS" (desktop, dock, windows, robot assistant, phone home screen on mobile). Hosted on GitHub Pages from this repo (`main`), live at https://araratyan98.github.io/berd-soft/. The owner writes in Armenian (often transliterated); reply in Armenian.

## Layout
- `berd-os/parts/` — the source. Edit only here:
  - `body.html` — markup + main script. Starts with the `window.BERD_CONFIG` block (contacts, `leadEndpoint`, `pricing`, analytics IDs). Portfolio visuals are `var PROJ = [...]` (id, name, cat `web|app|mob|bot`, url, brand colors c1/c2/c3, stack, mockup type `site|db|mob|tg`).
  - `content.js` — all texts in three languages (`hy`, `ru`, `en`); always change all three. Portfolio texts are `projects: { <id>: {kind, task, sol, res} }`. `content2.js` is deep-merged on top.
  - `features.js` — estimator, before/after slider (`var BA` lists projects that have a "before" state), live chat, time-of-day desktop, hidden game, blog window.
  - `blog.js` — blog articles; `extra.css`, `extra2.css` — styles.
- `berd-os/compose.js` — merges the parts into `berd-os/berd-os.html`. Keep its function replacers (`() => value`): content contains `$'`, which breaks string replacements.
- `build.js` (+ `build-blog.js`) — runs compose, then generates `index.html`, `ru/`, `en/`, `blog/`, sitemap, robots, 404 with per-language SEO. Generated files are committed; never edit them by hand.
- `berd-os/serve.js` — local preview at http://localhost:5178 (analytics IDs stripped so tests don't pollute stats).
- `berd-os/reel.html` + `record-reel.mjs` — Instagram reel recorder (needs ffmpeg); its timeline clicks project ids `nairi` and `dent`.
- `worker/` — Cloudflare Worker `berd-leads` (leads, calculator, live chat ↔ Telegram). Deployed by pasting into the Cloudflare dashboard editor; secrets live only in Cloudflare.

## Workflow
1. Edit `berd-os/parts/*`.
2. `node build.js`
3. Check locally with `node berd-os/serve.js`: desktop and phone widths, all three languages.
4. Commit and push to `main`; Pages deploys in a few minutes.

## Rules
- Text must read natural and short, no generic "AI" phrasing. Never invent client results or numbers; ask the owner.
- Never put tokens or secrets in this repo (it is public and served as-is, `.nojekyll`).
