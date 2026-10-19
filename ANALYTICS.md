# Վիճակագրություն. ինչ է հաշվում կայքը և ինչպես միացնել

Կայքը միանգամից ուղարկում է իրադարձություններ երկու գործիքի.

- **Google Analytics 4**. թվեր, աղբյուրներ, ձագարներ։
- **Microsoft Clarity**. այցելուների իրական տեսաձայնագրություններ և սեղմումների քարտեզ։

Մինչև ID-ները չգրեք կայքի կարգավորումներում (`analytics: { ga4, clarity }`), ոչ մի հետևող կոդ չի բեռնվում։

## Ինչ իրադարձություններ են հավաքվում

| Իրադարձություն | Երբ | detail |
|---|---|---|
| `hero_click` | Սեղանի կոճակները (Բացել աշխատանքները / Հաշվարկել) | `work`, `brief` |
| `app_open` | Ցանկացած պատուհանի բացում | `work`, `serv`, `proc`, `about`, `brief`, `chat`, `bot` |
| `project_open` | Նախագծի բացում | `aroma`, `cargo` … |
| `window_time` | Պատուհանը փակելիս կամ կայքից դուրս գալիս | պատուհանը + `seconds` |
| `bot_open`, `bot_question` | Օգնականի բացում, ինչ հարց են տվել | `price`, `pay`, `other` … |
| `brief_start` → `brief_step` → `brief_submit` | Բրիֆի ձագար | քայլը |
| `lead_sent` / `lead_failed` | Հայտն ուղարկվեց / չուղարկվեց | `brief`, `message` |
| `contact_click` | Telegram, հեռախոս, email, Instagram սեղմում | `Telegram`, `+374…` … |
| `lang_change` | Լեզվի փոփոխություն | `ru`, `en` |
| `exit_after` | Կայքից դուրս գալուց առաջ վերջին գործողությունը | օր.՝ `brief_step:feat` |

Clarity-ում բոլոր ձայնագրությունները, որտեղ հայտ է ուղարկվել, ավտոմատ նշվում են, որ հեշտ գտնեք։
Clarity-ն ձևերի դաշտերում գրվածը (անուն, հեռախոս) ձայնագրություններում ծածկում է։

## 1. Google Analytics 4 (5 րոպե)
1. Բացեք https://analytics.google.com և մուտք գործեք Google հաշվով։
2. **Start measuring** → Account name՝ `BERD SOFT` → Next։
3. Property name՝ `berd-soft site`, Time zone՝ **Armenia**, Currency՝ **AMD** → Next։
4. Ընտրեք բիզնեսի տվյալները (ցանկացած) → **Create** → ընդունեք պայմանները։
5. Platform՝ **Web** → Website URL՝ `araratyan98.github.io/berd-soft` → Stream name՝ `site` → **Create stream**։
6. Կտեսնեք **Measurement ID**՝ `G-XXXXXXXXXX`։ **Ուղարկեք այն ինձ։**

## 2. Microsoft Clarity (3 րոպե)
1. Բացեք https://clarity.microsoft.com և մուտք գործեք (Google կամ Microsoft հաշվով)։
2. **+ New project** → Name՝ `BERD SOFT` → Website URL՝ `https://araratyan98.github.io/berd-soft/` → **Add new project**։
3. Եթե առաջարկի տեղադրման եղանակ, ընտրեք **Install manually**։
4. Վերևում **Settings → Overview**. այնտեղ է **Project ID**-ն (օրինակ `k9x2abc3de`)։ **Ուղարկեք այն ինձ։**

## Ինչպես կարդալ տվյալները (մոտ 24 ժամ անց)
- **Քանի մարդ / որտեղից**. GA4 → Reports → Acquisition → Traffic acquisition (Instagram, Google, ուղիղ)։
- **Ինչ են սեղմում**. GA4 → Reports → Engagement → Events (`app_open`, `project_open`, `contact_click`)։
- **Որտեղ են դուրս գալիս բրիֆից**. GA4 → Explore → Funnel exploration → քայլեր՝ `brief_start` → `brief_step` (type, feat, design, time) → `brief_submit` → `lead_sent`։
- **Ինչն է վերջինը դուրս գալուց առաջ**. GA4 → Events → `exit_after` → detail պարամետր։
- **Տեսնել իրական այցելուներին**. Clarity → Recordings։ Ֆիլտր՝ Custom tags `view = phone` կամ Smart events։
- **Ուր են սեղմում**. Clarity → Heatmaps։

GA4-ում `detail`, `seconds` պարամետրերը հաշվետվություններում տեսնելու համար. Admin → Custom definitions → Create custom dimension → `detail` (Event scope), իսկ `seconds`-ի համար՝ Custom metric։
