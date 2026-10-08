# Hərrac / госаукционы Азербайджана — ориентир для Emlak Hub

> Не юридическая консультация. Сверяйте актуальные нормы и документы лота.

## Порталы

| Портал | URL | Что там |
|---|---|---|
| Hərrac.gov.az | https://herrac.gov.az | Гос. электронные объявления/торги (авто, недвижимость и др.) |
| eHerrac | https://eherrac.com | Электронные торги по исполнительным производствам |

Ключевые слова портала: avtomobil, daşınmaz əmlak, torpaq, dövlət hərracı.

## Публичное API (парсер)

Сайт — Next.js; данные с gateway:

| Метод | Путь | Назначение |
|---|---|---|
| POST | `/gw/os/v1/auctions?size=24&page=0&userFilter=false&status=ONGOING&categoryIds=…&includeNotStarted=true&sortColumns=DATE_DESC` с телом `[]` | Список. Так его вызывает сам сайт. GET на этот адрес отвечает 500 `AUCTION_ORGANIZATION_SERVICE_001` |
| GET | `/gw/os/v1/auctions/details/:id` | Карточка лота (стабильно) |
| GET | `/gw/os/v1/lots/categories/filters?filterType=ONGOING&showAll=false` | Категории + счётчики |
| GET | `/gw/fs/v1/files/stream/:fileId` | Фото |

### Фильтры UI → API (`/auctions`)

| UI | Query |
|---|---|
| Категории (Avtomobillər, Mənzil, …) | `categoryIds=id1,id2` |
| İlkin hərrac / Təkrar hərrac | `isFirstRound=true` / `false` (без параметра = оба) |
| Gözləmədə olanları da göstər | `includeNotStarted=true\|false` |
| Məkana görə axtar | `locationSearchValue` |
| Mətnə görə axtar | `nameSearchValue` |
| Başlama qiyməti Min / Maks | `priceFrom` / `priceTo` |
| Hərracın tarix aralığı | `from` / `to` |
| Şəhər / ünvan / Əlavə məlumat / qeyd | `bodyFilters` = JSON-массив `[{id,dataType,value}]` |
| Əvvəlcə yeni / köhnə / ucuz / bahalı | `sortColumns=DATE_DESC\|DATE_ASC\|PRICE_ASC\|PRICE_DESC` |

`bodyFilters.id` берутся из  
`GET /gw/os/v1/lots/categories/filters/details?categoryIds=…`  
(поля: şəhər, ünvan, əlavə məlumat, əlavə qeyd).

Код: `buildAuctionListParams()` в `src/lib/herrac/client.js`.  
Sync по умолчанию: **все 5 категорий** (как URL со всеми чекбоксами), `includeNotStarted=true`, без узких фильтров. Узкий фильтр — через `listFilters` в `syncHerracLots`.

### Категории (sync по умолчанию — все)

| id | Название | `lots.market` |
|---|---|---|
| `15707206488020125` | Avtomobillər | `auto` (экскаваторы → `equipment`) |
| `16057480568139276` | Mənzil | `estate` |
| `16057480568289305` | Qeyri-yaşayış | `commercial` |
| `16057480568289306` | Fərdi yaşayış evi | `estate` |
| `16057480568289307` | Digər | `other` / `land` по названию |

Ссылка «все категории»:  
`https://herrac.gov.az/auctions?categoryIds=15707206488020125,16057480568139276,16057480568289305,16057480568289306,16057480568289307`

### Расписание (чтобы не забанили)

**Не** polling каждые 2 часа по всем лотам.

| Фаза | Частота | Что делает |
|---|---|---|
| Discovery (list) | ≤ 2–3×/сутки (cooldown 8ч) | Новые id |
| Detail | точечно | Новые + ending &lt;48ч + устаревшие &gt;20ч |
| Пауза между HTTP | ~2.8–4.6 с + jitter | Вежливый UA `EmlakHub/1.0` + contact |
| Лимит detail / прогон | ≤ 48 (CLI `--max=`) | `HERRAC_RATE.maxDetailsPerRun` |

Код: `src/lib/herrac/{constants,client,mapLot,sync}.js`  
API: `POST /api/admin/herrac/sync` (admin cookie или `x-cron-secret: CRON_SECRET`)  
CLI: `npm run herrac:sync -- --force --seed=ID1,ID2 --max=24`

Если list API лежит (часто `AUCTION_ORGANIZATION_SERVICE_001` / 500) — bootstrap через `--seed=` (id из URL `/auctions/{id}/…` или карточек на странице). Detail API при этом обычно стабилен.

## Типы активов в продукте (`lots.market`)

| id | Примеры |
|---|---|
| `auto` | легковые, спецтехника на колёсах |
| `estate` | квартиры, дома, здания |
| `land` | земельные участки (с/х, ИЖС, иные) |
| `commercial` | офис, склад, магазин |
| `equipment` | оборудование, станки |
| `other` | прочее имущество |

Код: `src/lib/lots/markets.js`

## Нормативные столпы (ориентиры)

1. **«İcra haqqında» Qanun** — продажа имущества должника, сроки, специализированные организации.
2. **Torpaq bazarı haqqında Qanun** — купля-продажа земли, аукцион/конкурс, заложенные земли.
3. **Госреестр недвижимости** — права и ограничения (ипотека, арест, сервитут).

Код: `src/lib/herrac/knowledge.js`

## Риски, которые закрываем в UI

- Обременения / арест  
- Кадастр ≠ объявление  
- Назначение земли  
- Муниципальная vs частная земля  
- Дедлайны депозита и оплаты после победы  
- VIN / протокол (авто)  
- Третьи лица  
- Доступ / коммуникации / сервитут  

## Что нужно от вас

1. **`CRON_SECRET`** в `.env.local` — для внешнего cron (GitHub Actions / crontab), без логина админа.  
2. **`NEXT_PUBLIC_M10_PHONE`** — номер для ручной оплаты.  
3. На проде: исходящий HTTPS к `herrac.gov.az` разрешён.  
4. Cron пример (2×/день, не чаще):  
   `0 7,19 * * * curl -X POST -H "x-cron-secret: $CRON_SECRET" https://YOUR_HOST/api/admin/herrac/sync`  
5. Опционально: расширить категории (дома / коммерция) — скажите, добавим в `DEFAULT_SYNC_CATEGORY_IDS`.

## Где в коде

| Что | Файл |
|---|---|
| Каталог рисков / чеклист | `src/lib/herrac/knowledge.js` |
| Парсер / sync | `src/lib/herrac/*`, `scripts/herrac-sync.js` |
| Карточка рисков | `src/components/terminal/LegalRisks.jsx` |
| Шаги после Hub | `src/components/terminal/HerracNextSteps.jsx` |
| Админ CRUD + кнопка синка | `src/components/admin/LotsManager.jsx` + `/api/lots` + `/api/admin/herrac/sync` |
