# Հայտերը Telegram-ով. միացման հրահանգ (մոտ 10 րոպե)

Կայքի «Կապ» պատուհանը և «Բրիֆ»-ը հայտերն ուղարկում են փոքր անվճար սերվերի (Cloudflare Worker), իսկ այն էլ ուղարկում է ձեր Telegram-ին։ Բոտի բանալին պահվում է միայն Cloudflare-ում, կայքի կոդում այն չկա։

## 1. Ստեղծեք Telegram բոտ
1. Telegram-ում բացեք **@BotFather**-ը և գրեք `/newbot`։
2. Տվեք անուն (օրինակ `BERD SOFT Հայտեր`) և username (օրինակ `berdsoft_leads_bot`)։
3. BotFather-ը կուղարկի **token**, որը նման է `123456789:AA...`-ին։ Պահեք այն, ոչ մեկին մի ուղարկեք։
4. Բացեք ձեր նոր բոտը և սեղմեք **Start**։

## 2. Իմացեք ձեր chat ID-ն
1. Telegram-ում բացեք **@userinfobot**-ը և սեղմեք Start։
2. Այն կգրի ձեր **Id**-ն (թիվ, օրինակ `123456789`)։ Սա ձեր chat ID-ն է։
   - Եթե ուզում եք հայտերը ստանալ խմբում, ավելացրեք բոտը խմբին, և խմբի ID-ն կսկսվի `-`-ով։

## 3. Ստեղծեք Cloudflare Worker
1. Գրանցվեք https://dash.cloudflare.com կայքում (անվճար է)։
2. Ձախ ընտրացանկում բացեք **Workers & Pages → Create → Create Worker**։
3. Անվանեք `berd-leads` և սեղմեք **Deploy**։
4. Սեղմեք **Edit code**, ջնջեք եղած կոդը և տեղադրեք `telegram-lead.js` ֆայլի ամբողջ պարունակությունը։ Սեղմեք **Deploy**։

## 4. Ավելացրեք բանալիները
Worker-ի էջում բացեք **Settings → Variables and Secrets → Add**.

| Անուն | Տեսակ | Արժեք |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Secret | BotFather-ի token-ը |
| `TELEGRAM_CHAT_ID` | Secret | ձեր chat ID-ն |
| `ALLOWED_ORIGIN` | Text | `https://araratyan98.github.io` |

Սեղմեք **Deploy**։

## 5. Միացրեք կայքին
Worker-ի էջի վերևում կա հասցե, օրինակ `https://berd-leads.ձեր-անուն.workers.dev`։ Ուղարկեք այն ինձ, կամ ինքներդ գրեք `index.html`-ի կարգավորումների բլոկում.

```js
leadEndpoint: 'https://berd-leads.ձեր-անուն.workers.dev',
```

Դրանից հետո կայքից ուղարկված յուրաքանչյուր հայտ կգա ձեր Telegram-ին՝ անունով, կոնտակտով և բրիֆի պատասխաններով։

## Պաշտպանություն
- Հայտերը ընդունվում են միայն ձեր կայքից (`ALLOWED_ORIGIN`)։
- Մեկ հասցեից րոպեում ամենաշատը 5 հայտ։
- Ձևերում կա թաքնված դաշտ, որը լրացնում են միայն սպամ-բոտերը. այդպիսի հայտերը անտեսվում են։
- Եթե հետագայում միացնեք ձեր դոմենը, ավելացրեք այն `ALLOWED_ORIGIN`-ում ստորակետով. `https://araratyan98.github.io,https://berdsoft.am`։
