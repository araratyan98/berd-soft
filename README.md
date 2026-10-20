# BERD SOFT

Կայքը՝ «BERD OS». նոութբուքի էկրանին աշխատող սեղան, դոկ, պատուհաններ, բրիֆ և BERD Օգնական։ Երեք լեզու՝ հայերեն, ռուսերեն, անգլերեն։

- Հայերեն՝ https://araratyan98.github.io/berd-soft/
- Русский՝ https://araratyan98.github.io/berd-soft/ru/
- English՝ https://araratyan98.github.io/berd-soft/en/

## Կարգավորումներ
`berd-os/parts/body.html`-ի սկզբում `BERD_CONFIG` բլոկն է. կոնտակտներ, հայտերի հասցե (`leadEndpoint`), վիճակագրություն։

## Ադմին (աշխատանքներ, տեքստեր, կոնտակտներ, գներ)
1. Կրկնակի սեղմեք `ADMIN.cmd` (կամ `node admin/server.js`)։ Բրաուզերում կբացվի http://127.0.0.1:5179։
2. Փոխեք, ինչ պետք է, և սեղմեք «Պահպանել»։ «Դիտել կայքը»-ով կտեսնեք արդյունքը մինչև հրապարակելը։
3. «Հրապարակել»՝ commit և push դեպի `main`, ադմինը սպասում է, մինչև կայքը թարմանա։

Ադմինը աշխատում է միայն այս համակարգչում և բացվելիս ինքն է բերում վերջին տարբերակը (`git pull`)։ Պատուհանը փակելով այն կանգնում է։

## Ձեռքով թարմացնել
1. Տեքստերը՝ `berd-os/parts/content.json`, աշխատանքները՝ `parts/projects.json`, ոճերը՝ `parts/extra.css`, կոդը՝ `parts/body.html`։
2. `node build.js` (ինքը նախ compose է անում) → commit և push։

## Հայտեր Telegram-ով
Տես `worker/SETUP.md`։

## Ֆայլեր
- `index.html`, `ru/`, `en/`՝ էջերը (ստեղծվում են `build.js`-ով)
- `og-hy.png`, `og-ru.png`, `og-en.png`՝ հղման նախադիտման նկարներ (`tools/og.html`)
- `sitemap.xml`, `robots.txt`՝ Google-ի համար
