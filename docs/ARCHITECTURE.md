# Архитектура Emlak Hub

> Цель документа: любой разработчик за 15 минут понимает, **где что лежит**
> и **почему выбран PostgreSQL**, а не Firebase.

---

## Почему PostgreSQL, а не Firebase

| Критерий | PostgreSQL | Firebase / Firestore |
|---|---|---|
| Контроль данных | On-prem / свой VPS / суверенный регион | Данные у Google |
| Гос / банк / SOC | Стандарт (e-gov EU, банки, fintech) | Обычно запрещён для чувствительных систем |
| Транзакции / платежи | ACID, foreign keys, audit | Слабее для денег |
| SQL / отчёты | Нативно | Обходные пути |
| Vendor lock-in | Низкий | Высокий |

**Спецслужбы и госцифровизация** опираются на реляционные СУБД (часто PostgreSQL или Oracle) с шифрованием диска, журналом аудита и доступом по ролям.  
Firebase удобен для прототипов, но **не** как основная БД продукта уровня Emlak Hub (деньги, KYC, fraud).

Сессия — PostgreSQL и cookie. Firebase из проекта убран.

---

## Стек

```
Browser (Next.js App Router)
    │
    ▼
Route Handlers  src/app/api/**
    │  session cookie (httpOnly)
    ▼
Prisma Client   src/lib/db/prisma.js
    │
    ▼
PostgreSQL 16   таблицы: users, lots, payments, audit_logs, …
```

- **ORM:** Prisma (`prisma/schema.prisma`)
- **Auth:** email + bcrypt password_hash, сессия в httpOnly cookie
- **Платежи:** запись `payments` со статусом `pending` → админ `paid` → обновление `users.subscription_*`
- **Эквайринг (GoldenPay и т.д.):** позже адаптер в `src/lib/payments/providers/`

---

## Таблицы (кратко)

| Таблица | Назначение |
|---|---|
| `users` | Профиль, роль, блокировка, окно PRO (`subscription_*`) |
| `lots` | Лоты аукциона (реальные; старт с пустой таблицы) |
| `payments` | Журнал транзакций: сумма, статус, plan_id, active_from/to |
| `audit_logs` | Кто что сделал в админке |
| `tickets` / `fraud_cases` | Поддержка и антифрод (миграция с localStorage) |

Подробные поля и комментарии - в `prisma/schema.prisma`.

---

## Права доступа (сервер)

1. **Investor** без PRO → API лотов возвращает `403` / пустой список; UI показывает paywall.
2. **Investor** с PRO → читает `lots` (published), свои `payments`.
3. **Admin / support / soc / developer** → по матрице привилегий (`role` + `src/lib/adminPrivileges.js`).
4. Смена `role` / `blocked` / подтверждение оплаты - **только серверные** admin-роуты, не из браузера напрямую в БД.

---

## Переменные окружения

См. `.env.local.example`:

- `DATABASE_URL` - строка PostgreSQL
- `SESSION_SECRET` - ≥32 символа для подписи cookie
- `NEXT_PUBLIC_APP_URL` - публичный URL

---

## Локальный запуск БД

```bash
# пример Docker
docker run --name emlak-pg -e POSTGRES_PASSWORD=emlak -e POSTGRES_DB=emlak_hub -p 5432:5432 -d postgres:16

# .env.local
DATABASE_URL="postgresql://postgres:emlak@localhost:5432/emlak_hub?schema=public"
SESSION_SECRET="change-me-to-a-long-random-string"

npx prisma migrate dev --name init
npm run dev
```

Без `DATABASE_URL` приложение поднимается в **UI-only** режиме (пустые лоты, демо-логин из `testAccounts` только для разработки админки).

```bash
# после migrate
npm run db:seed   # нужен SEED_ADMIN_PASSWORD в .env, пароль по умолчанию не задан
```

---

## API (Route Handlers)

| Метод | Путь | Кто | Что делает |
|---|---|---|---|
| POST | `/api/auth/login` | public | email+password → cookie |
| POST | `/api/auth/logout` | session | сброс cookie |
| POST | `/api/auth/register` | public | инвестор Free |
| GET | `/api/auth/me` | cookie | профиль |
| GET/POST | `/api/payments` | session | журнал / заявка pending |
| POST | `/api/payments/[id]/confirm` | admin | paid + active_from/to + PRO |
| GET | `/api/lots` | PRO / admin | published лоты |

---

## Где править что

| Задача | Файл |
|---|---|
| Цены / лимиты Free | `src/lib/subscription.js` |
| Схема БД | `prisma/schema.prisma` |
| Подключение Prisma | `src/lib/db/prisma.js` |
| Логин / сессия | `src/app/api/auth/*`, `src/lib/auth/session.js` |
| Пользователи (админ↔терминал) | `src/app/api/users/*`, `src/lib/db/users.js` |
| Платежи | `src/app/api/payments/*`, `src/lib/db/payments.js` |
| Лоты | `src/app/api/lots/*`, `src/lib/db/lots.js` |
| Типы лотов / карта | `src/lib/lots/markets.js` |
| Hərrac риски / законы | `docs/HERRAC.md`, `src/lib/herrac/knowledge.js` |
| Paywall UI | `src/components/terminal/PaywallModal.jsx` |
| Прайс на лендинге | `src/components/landing/PricingSection.jsx` |
| Журнал в профиле | `src/app/(terminal)/profile/page.js` |
