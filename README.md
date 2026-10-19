# BERD SOFT

Կայքը՝ «BERD OS». նոութբուքի էկրանին աշխատող սեղան, դոկ, պատուհաններ, բրիֆ և BERD Օգնական։ Երեք լեզու՝ հայերեն, ռուսերեն, անգլերեն։

- Հայերեն՝ https://araratyan98.github.io/berd-soft/
- Русский՝ https://araratyan98.github.io/berd-soft/ru/
- English՝ https://araratyan98.github.io/berd-soft/en/

## Կարգավորումներ
`berd-os/parts/body.html`-ի սկզբում `BERD_CONFIG` բլոկն է. կոնտակտներ, հայտերի հասցե (`leadEndpoint`), վիճակագրություն։

## Ինչպես թարմացնել
1. Տեքստերը՝ `berd-os/parts/content.js` (երեք լեզուն), ոճերը՝ `parts/extra.css`, կոդը՝ `parts/body.html`։
2. `node build.js` (ինքը նախ compose է անում) → commit և push։

## Հայտեր Telegram-ով
Տես `worker/SETUP.md`։

## Ֆայլեր
- `index.html`, `ru/`, `en/`՝ էջերը (ստեղծվում են `build.js`-ով)
- `og-hy.png`, `og-ru.png`, `og-en.png`՝ հղման նախադիտման նկարներ (`tools/og.html`)
- `sitemap.xml`, `robots.txt`՝ Google-ի համար
