# Тестовый доступ — Digital Emlak Hub

Используйте, пока Firebase не подключён (`.env.local` пустой).

## Вход

| Роль | Email | Пароль | Куда |
|------|-------|--------|------|
| **Админ** | `admin@emlakhub.net` | `EmlakHub2026!` | `/admin/users` |
| **Инвестор (Free)** | `investor@emlakhub.net` | `EmlakHub2026!` | `/dashboard` · 2 карточки |
| **Разработчик** | `dev@emlakhub.net` | `EmlakHub2026!` | система / security |
| **Поддержка** | `support@emlakhub.net` | `EmlakHub2026!` | только `/admin/support` |

## Подписка

- Free: список лотов открыт, **макс. 2 карточки**, карта/сравнение/портфель/документы/алерты — PRO
- PRO: демо-оплата в модалке (1 / 3 / 12 мес.)
- Админ может выдать PRO или снять в `/admin/users`

## Админка

- `/admin/users` — роли, блок, PRO, создать/удалить
- `/admin/finance` — оплаты
- `/admin/support` — чат
- `/admin/system` — kill-switch (техработы / сбой)
- `/admin/security` — привилегии, аудит, быстрые меры
