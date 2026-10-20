# BERD SOFT site

Studio website in the style of a laptop "OS" (desktop, dock, windows, robot assistant, phone home screen on mobile). Hosted on GitHub Pages from this repo (`main`), live at https://araratyan98.github.io/berd-soft/. The owner writes in Armenian (often transliterated); reply in Armenian.

## Layout
- `berd-os/parts/` — the source. Edit only here:
  - `body.html` — markup + main script. Starts with the `window.BERD_CONFIG` block (contacts, `leadEndpoint`, `pricing`, analytics IDs). `var PROJ` is injected from `projects.json`.
  - `projects.json` — the portfolio (edited by the owner in the admin): per project id, name, cat `web|app|mob|bot`, url shown in the address bar, link to the live project or '', brand colors c1/c2/c3, stack, optional `hidden`, and `text.{hy,ru,en}` = {kind, role, task, sol, res?, name?, stack?} (`name`/`stack` override per language, used where only features, not the tech, are known). Visual fields ( name, cat `web|app|mob|bot`, url shown in the address bar, link to the live project or '', brand colors c1/c2/c3, stack, type `shot` = one screenshot with its size `w` (default 1200) × `h`, or `phones` = two app screens). 16 projects; the phone home rail shows the first 6. Images are WebP in `media/work/` (`<id>.webp` up to 1200px wide, never upscaled, `<id>-thumb.webp` 640×400, `<id>-1/-2.webp` for phones); they load only when a project or the work window opens. Real projects only, no invented results: the "Result" row is hidden when `res` is empty. Every project is described as work we did for someone, never as our own product (no "author of the product" / "own product").
  - `content.json` — all other site texts in three languages (`hy`, `ru`, `en`); always change all three. The owner edits it in the admin; keep its shape (the admin only changes existing strings).
  - `features.js` — estimator, before/after slider (`var BA` lists projects that have a real "before" screenshot; empty for now), live chat, time-of-day desktop, hidden game, blog window.
  - `blog.js` — blog articles; `extra.css`, `extra2.css` — styles.
- `admin/` — the owner's local admin (`ADMIN.cmd` or `node admin/server.js` → http://127.0.0.1:5179): add/edit/hide/reorder/delete works with image upload (the browser makes the WebP files), all texts, contacts and estimator prices; every save rebuilds the site, "Publish" commits and pushes to `main` with the computer's own git and waits for Pages. Binds to 127.0.0.1 only, checks the Host header and a per-start token; no secrets. Pulls from `main` on start (two computers). `--port=N --no-open` for tests.
- `berd-os/compose.js` — merges the parts into `berd-os/berd-os.html`. Keep its function replacers (`() => value`): content contains `$'`, which breaks string replacements.
- `build.js` (+ `build-blog.js`) — runs compose, then generates `index.html`, `ru/`, `en/`, `blog/`, sitemap, robots, 404 with per-language SEO. Generated files are committed; never edit them by hand.
- `berd-os/serve.js` — local preview at http://localhost:5178 (analytics IDs stripped so tests don't pollute stats); also serves `/media/`.
- `berd-os/reel.html` + `record-reel.mjs` — Instagram reel recorder (needs ffmpeg); its timeline clicks project ids `walletly` and `ararat-park`. `media/berd-soft-reel.mp4` was recorded before the real projects and still shows the old sample ones.
- `worker/` — Cloudflare Worker `berd-leads` (leads, calculator, live chat ↔ Telegram). Deployed by pasting into the Cloudflare dashboard editor; secrets live only in Cloudflare.

## Workflow
1. Edit `berd-os/parts/*`.
2. `node build.js`
3. Check locally with `node berd-os/serve.js`: desktop and phone widths, all three languages.
4. Commit and push to `main`; Pages deploys in a few minutes.

## Rules
- Text must read natural and short, no generic "AI" phrasing. Never invent client results or numbers; ask the owner.
- Never put tokens or secrets in this repo (it is public and served as-is, `.nojekyll`).
