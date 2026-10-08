# Production

Digital Emlak Hub is an analytics terminal beside Azerbaijan state auctions. This file is the deployment note. It is not a claim that a public server already exists.

## Required environment

- `DATABASE_URL` — PostgreSQL connection string.
- `SESSION_SECRET` — at least 32 characters. In production the app refuses to sign sessions if this is missing, shorter, or a known dev fallback.
- Do not set `NEXT_PUBLIC_ALLOW_DEMO=1` in production. Demo accounts are disabled when `NODE_ENV=production`.

See `.env.example` for names only.

## Database

PostgreSQL. Apply migrations with:

```bash
npx prisma migrate deploy
```

Do not rely on a developer's local database. `npm run build` runs `prisma migrate deploy` before `next build`, so the build environment needs `DATABASE_URL`.

## Build and start

```bash
npm ci
npm run build
npm run start
```

The process must sit behind HTTPS. Cookies are `Secure` only when `NODE_ENV=production`.

## Reverse proxy

This codebase is a single Node process. Put TLS, the public host, and compression on the proxy (Caddy, nginx, or the host's load balancer). Forward `X-Forwarded-For` only from that proxy.

## Rate limiting

The limiter is in-memory and correct only for one Node process. It does not share counters across instances.

Running more than one instance without a shared limiter is a public-production blocker. Do not scale out until that store exists. This repository does not include one.

## Hərrac sync

Nothing in this repository starts sync on a clock. `scheduled` on the status endpoint stays false until an external scheduler exists.

One run, from the server that has `CRON_SECRET`:

```bash
curl -sS -X POST \
  -H "x-cron-secret: $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"forceDiscovery":true}' \
  https://YOUR_HOST/api/admin/herrac/sync
```

Status, without starting a run:

```bash
curl -sS \
  -H "x-cron-secret: $CRON_SECRET" \
  https://YOUR_HOST/api/admin/herrac/sync
```

The admin lots screen reads the same row: last attempt, last success, status, received, created, updated, failed, and a short error. That row is not a claim that a cron job is installed.

Example crontab, only after the host and secret exist. This file does not install it. Twice a day is enough; the app also refuses a second run while one is already marked running.

```bash
0 7,19 * * * curl -sS -X POST -H "x-cron-secret: $CRON_SECRET" -H "Content-Type: application/json" -d '{"forceDiscovery":true}' https://YOUR_HOST/api/admin/herrac/sync
```

The same schedule as a systemd timer is in `deploy/herrac-sync.service` and `deploy/herrac-sync.timer`. Copying those files onto Ubuntu does not happen from this repository. Until an administrator enables one of them, the monitor keeps saying that no scheduler is installed. Do not enable both cron and the timer.

A run that cannot read the public list is stored as `partial`, not `success`. `success` means the list of identifiers was compared. HTTP 500 on the old GET is not treated as a block: the public site loads that catalog with POST.

Do not start that run inside a normal Vercel request. The catalog walk and the card updates take minutes. Vercel should only receive the short status read, or a trigger that a separate worker performs. The systemd unit in `deploy/` is that worker. It is not installed by a deploy.

## Password reset

There is no mail provider and no reset route. Do not show “we sent an email”. Password reset stays an external requirement until a real provider sends mail. An admin can set a new password in the user record; that increment invalidates old sessions.

## Sessions

The session is an httpOnly JWT (`eh_session`), 14 days, `SameSite=Lax`, `Secure` in production. The token carries `sessionVersion`. Login, block, password change, “log out everywhere” for that user, and the admin “revoke all sessions” action increment the counter. Older tokens then fail the database check.

`POST /api/auth/logout-all` revokes the current account. `POST /api/admin/sessions/revoke` revokes every account and clears the caller’s cookie.

## Admin bootstrap

`npm run db:seed` is a manual dev command. It is not part of `next start`. In production the seed refuses a password shorter than 12 characters and refuses the known local seed password. Create the first admin with a unique `SEED_ADMIN_PASSWORD`, run seed once, then remove that password from the runtime environment. Rotate it if it was ever the known local value.

## Payments

Confirmation is manual. A pending payment is not PRO. `POST /api/payments/webhook` returns 501 until a real provider is connected and checked. There is no card processor credential in this repo. Emlak Partners grants service days, not cash, and only after that confirmed payment.

## Backups

Back up PostgreSQL (users, lots, payments, support, consents, workspaces, scenarios, audit). There is no separate upload disk: support files are data URLs in the database, so they are inside the Postgres backup. Store environment secrets outside the database backup and outside git.

## Monitoring

Log API failures, sync failures, auth anomalies, payment errors, and market failures on the server. Do not log passwords, session tokens, or `SESSION_SECRET`. `/api/health` returns `{ ok, db }` and no credentials. No external monitoring vendor is connected.

## Rollback

Keep the previous build artifact. If a migration is backward-compatible, redeploy the previous build. If a migration is not, restore the Postgres backup taken before `migrate deploy`. Do not edit applied migration files.

## Secret rotation

If `SESSION_SECRET`, `DATABASE_URL`, or the admin password has appeared in a chat, a shell history, or a committed file, rotate it. Changing `SESSION_SECRET` signs everyone out.
