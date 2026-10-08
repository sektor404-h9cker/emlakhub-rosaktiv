# Release checklist

Unchecked items are not done. A green build does not check them.

- [ ] Environment configured (`DATABASE_URL`, `SESSION_SECRET` ≥ 32 chars)
- [ ] Secrets rotated if they were ever the local seed or a shared dev value
- [ ] PostgreSQL backup configured
- [ ] Migrations applied on a clean database
- [ ] Legal documents reviewed for Azerbaijan production launch
- [ ] HTTPS on the public host
- [ ] Auth tested (register, consent, login, logout, blocked user)
- [ ] Admin tested (users, lots, finance journal, support, danger confirmation)
- [ ] Hərrac sync tested, including a failed response that does not wipe lots
- [ ] Market tested on a confirmed sample and on an insufficient sample
- [ ] Payment tested: pending stays pending until a real confirmation
- [ ] Webhook still returns 501 and does not mark a payment paid
- [ ] Emlak Partners: first payment grants once, refund reverses days, self-invite is rejected
- [ ] Azerbaijan lawyer reviewed terms, refunds, privacy, and Emlak Partners rules
- [ ] Mobile tested (390 and 412 widths) on terminal, lot, compare, portfolio, support, auth
- [ ] Production build
- [ ] Smoke test of one new user through a real lot and a saved scenario

Internal security checks in this repository are not an external security audit.
