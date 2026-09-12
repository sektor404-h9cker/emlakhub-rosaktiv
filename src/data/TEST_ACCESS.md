# Тестовый доступ — Digital Emlak Hub

Используйте, пока Firebase не подключён (`.env.local` пустой).

## Вход

Откройте **http://localhost:3000/login** и введите email + пароль как в таблице.

| Роль | Email | Пароль | Куда попадёте |
|------|-------|--------|----------------|
| **Админ** | `admin@emlakhub.net` | `EmlakHub2026!` | `/admin/users` |
| **Инвестор** | `investor@emlakhub.net` | `EmlakHub2026!` | `/dashboard` |
| **Разработчик** | `dev@emlakhub.net` | `EmlakHub2026!` | `/admin/users` (аккаунт заблокирован — для проверки блокировки) |

## Разделы админки

- `/admin/users` — роли и блокировка
- `/admin/finance` — оплаты и подписки
- `/admin/support` — чат с клиентами

## Терминал инвестора

- `/dashboard` — лоты, Vision-сетка, юнит-экономика

## Демо-данные

Лоты: `src/data/demoLots.js`  
Пользователи / платежи / чат (без Firebase): `src/lib/firebase/firestore.js` → mock-блоки.

## Продакшен

После настройки Firebase создайте реального админа в Console и задайте роль `admin` в коллекции `users/{uid}`.
