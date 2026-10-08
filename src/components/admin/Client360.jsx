"use client";

/**
 * Client360 - полная карточка: IP, сессии, fraud, тикеты, удаление
 */

import {
  formatExpiry,
  isProActive,
  daysLeft,
  adjustSubscriptionDays,
  PLANS,
} from "@/lib/subscription";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";
import { useSystem } from "@/context/SystemContext";
import { usePaymentsJournal } from "@/hooks/usePaymentsJournal";
import { useSupportDesk } from "@/hooks/useSupportDesk";
import { updateUserApi } from "@/lib/api/client";
import {
  accountStatusMeta,
  resolveAccountStatus,
  ACCOUNT_STATUSES,
  getFraudScenario,
  scenarioCopy,
} from "@/lib/fraudIntel";
import { personLabel, presenceMeta } from "@/lib/staffProfile";
import UserAvatar from "@/components/terminal/UserAvatar";
import Link from "next/link";

export default function Client360({ user, onClose, onDeleted, onUserChange }) {
  const { t, locale } = useAdminI18n();
  const { fraudCases, deleteUser, wipeUserSensitive, pushAudit } = useSystem();
  const { tickets } = useSupportDesk();
  const { rows: payRows, configured: payDb } = usePaymentsJournal();

  if (!user) return null;

  const pro = isProActive(user.subscription);
  const userTickets = tickets.filter((x) => x.userEmail === user.email);
  const userPays = (payDb ? payRows : []).filter(
    (p) => p.userEmail === user.email
  );
  const userFraud = fraudCases.filter((f) => f.userEmail === user.email);
  const st = accountStatusMeta(resolveAccountStatus(user), locale);
  const pm = presenceMeta(user.presence || "offline", locale);

  const persistSub = async (subscription) => {
    const updated = await updateUserApi(user.id, {
      subscriptionPlan: subscription.plan,
      subscriptionStartsAt: subscription.startsAt,
      subscriptionExpiresAt: subscription.expiresAt,
      blocked: user.blocked,
    });
    onUserChange?.(updated.user || { ...user, subscription });
    pushAudit(
      "admin",
      `Subscription → ${user.email}: ${subscription.plan}`,
      "warn"
    );
  };

  const bump = async (days) => {
    const subscription = adjustSubscriptionDays(user.subscription, days);
    await persistSub(subscription);
  };

  return (
    <div className="fixed inset-0 z-[70] flex justify-end bg-black/50">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="close"
        onClick={onClose}
      />
      <aside className="relative z-10 flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#0a0c12] shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4">
          <div className="flex items-start gap-3">
            <UserAvatar
              name={personLabel(user)}
              avatarId={user.avatarId || "slate"}
              size="lg"
              status={user.presence ? pm.color : undefined}
            />
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#64748b]">
                {t.usersClient360}
              </p>
              <h2 className="mt-1 text-lg font-semibold text-white">
                {personLabel(user)}
              </h2>
              <p className="text-[12px] text-[#9aa3ad]">{user.email}</p>
              <span
                className={`mt-2 inline-block rounded-md px-2 py-0.5 text-[10px] ${st.cls}`}
              >
                {st.label}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[12px] text-[#64748b]"
          >
            {t.close}
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-4">
          <section className="grid grid-cols-2 gap-2">
            <Info label="Телефон" value={user.phone || "-"} />
            <Info label="Компания" value={user.company || "-"} />
            <Info label="IP" value={user.lastIp || "-"} mono />
            <Info label="Geo" value={user.lastGeo || "-"} />
            <Info label="Device" value={user.lastDevice || "-"} />
            <Info
              label="Risk score"
              value={String(user.riskScore ?? 0)}
              mono
              danger={(user.riskScore || 0) >= 70}
            />
            <Info
              label="Попытки оплаты"
              value={String(user.paymentAttempts ?? 0)}
              mono
            />
            <Info
              label="Fail login"
              value={String(user.failedLogins ?? 0)}
              mono
            />
          </section>

          <section className="rounded-xl border border-white/10 p-3">
            <h3 className="text-[12px] font-medium text-white">Статус аккаунта</h3>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {ACCOUNT_STATUSES.map((s) => {
                const m = accountStatusMeta(s.id, locale);
                const on = resolveAccountStatus(user) === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={async () => {
                      const data = await updateUserApi(user.id, {
                        blocked: s.id === "blocked",
                      });
                      onUserChange?.(data.user || { ...user, blocked: s.id === "blocked", accountStatus: s.id });
                    }}
                    className={[
                      "rounded-lg px-2.5 py-1 text-[11px]",
                      on ? m.cls : "text-[#64748b] hover:text-white",
                    ].join(" ")}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-xl border border-white/10 p-3">
            <h3 className="text-[12px] font-medium text-white">{t.clientSub}</h3>
            <p className="mt-1 font-mono text-[13px] text-emerald-300">
              {pro ? "PRO" : "FREE"}
              {pro && daysLeft(user.subscription) != null
                ? ` · ${daysLeft(user.subscription)}d`
                : ""}
            </p>
            <p className="mt-1 text-[11px] text-[#64748b]">
              {user.subscription?.startsAt || user.subscription?.expiresAt
                ? `${formatExpiry(user.subscription?.startsAt, "ru")} → ${formatExpiry(user.subscription?.expiresAt, "ru")}`
                : "—"}
            </p>
            <div className="mt-2 flex flex-wrap gap-1">
              {[7, 30, 90, -7].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => bump(d)}
                  className="rounded-md border border-white/10 px-2 py-1 font-mono text-[10px] text-[#93c5fd]"
                >
                  {d > 0 ? `+${d}d` : `${d}d`}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  persistSub({
                    plan: PLANS.FREE,
                    startsAt: null,
                    expiresAt: null,
                  })
                }
                className="rounded-md border border-rose-400/30 px-2 py-1 font-mono text-[10px] text-rose-300"
              >
                → Free
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 p-3">
            <h3 className="text-[12px] font-medium text-white">
              Сессии · {(user.sessions || []).length}
            </h3>
            <ul className="mt-2 space-y-2">
              {(user.sessions || []).length ? (
                user.sessions.map((s) => (
                  <li
                    key={s.id}
                    className="rounded-lg border border-white/[0.06] px-2.5 py-2 text-[11px]"
                  >
                    <div className="flex justify-between gap-2">
                      <span className="font-mono text-[#e2e8f0]">{s.ip}</span>
                      {s.current ? (
                        <span className="text-emerald-300">current</span>
                      ) : null}
                    </div>
                    <div className="text-[#64748b]">
                      {s.geo} · {s.device}
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-[11px] text-[#64748b]">Нет сохранённых сессий</li>
              )}
            </ul>
          </section>

          <section className="rounded-xl border border-white/10 p-3">
            <h3 className="text-[12px] font-medium text-white">
              {t.clientTickets} · {userTickets.length}
            </h3>
            <ul className="mt-2 space-y-1 text-[11px] text-[#9aa3ad]">
              {userTickets.slice(0, 6).map((x) => (
                <li key={x.id} className="flex flex-wrap gap-1">
                  <span className="font-mono text-sky-300">{x.id}</span>
                  {x.source === "fraud_intel" ? (
                    <span className="rounded bg-rose-500/20 px-1 text-[9px] text-rose-200">
                      fraud
                    </span>
                  ) : null}
                  <span>
                    · {x.status} · {x.subject}
                  </span>
                </li>
              ))}
              {!userTickets.length ? <li>-</li> : null}
            </ul>
            <Link
              href="/admin/support"
              className="mt-2 inline-block text-[11px] text-sky-300"
            >
              Открыть поддержку →
            </Link>
          </section>

          <section className="rounded-xl border border-white/10 p-3">
            <h3 className="text-[12px] font-medium text-white">
              {t.clientPayments} · {userPays.length}
            </h3>
            <ul className="mt-2 space-y-1 text-[11px] text-[#9aa3ad]">
              {userPays.map((p) => (
                <li key={p.id} className="rounded-lg border border-white/[0.06] px-2 py-1.5">
                  <div>
                    {p.planId || p.plan} · ₼{p.amount} · {p.status}
                  </div>
                  {p.activeFrom || p.activeTo ? (
                    <div className="mt-0.5 font-mono text-[10px] text-[#64748b]">
                      {formatExpiry(p.activeFrom, "ru")} →{" "}
                      {formatExpiry(p.activeTo, "ru")}
                    </div>
                  ) : null}
                </li>
              ))}
              {!userPays.length ? <li>-</li> : null}
            </ul>
          </section>

          <section className="rounded-xl border border-rose-400/20 bg-rose-500/[0.06] p-3">
            <h3 className="text-[12px] font-medium text-rose-100">
              {t.clientFraud} · {userFraud.length}
            </h3>
            <ul className="mt-2 space-y-2 text-[11px] text-rose-100/80">
              {userFraud.map((f) => {
                const sc = f.scenarioId
                  ? getFraudScenario(f.scenarioId)
                  : null;
                const title = sc
                  ? scenarioCopy(sc, locale).title
                  : f.reason;
                return (
                  <li key={f.id}>
                    <span className="font-mono">{f.id}</span> · score {f.score} ·{" "}
                    {f.status}
                    <div className="text-rose-100/60">{title}</div>
                    {f.ticketId ? (
                      <div className="font-mono text-[10px] text-sky-300">
                        ticket {f.ticketId}
                      </div>
                    ) : null}
                  </li>
                );
              })}
              {!userFraud.length ? <li>-</li> : null}
            </ul>
            <Link
              href="/admin/security"
              className="mt-2 inline-block text-[11px] text-rose-200"
            >
              Антифрод →
            </Link>
          </section>

          {user.notes ? (
            <section className="rounded-xl border border-white/10 p-3">
              <h3 className="text-[12px] font-medium text-white">Заметки</h3>
              <p className="mt-1 text-[12px] text-[#9aa3ad]">{user.notes}</p>
            </section>
          ) : null}

          <button
            type="button"
            onClick={() => {
              wipeUserSensitive(user.id);
              pushAudit("admin", `Wipe 360: ${user.email}`, "warn");
            }}
            className="w-full rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-2.5 text-left text-[12px] text-amber-100"
          >
            {t.usersWipe}
            <span className="mt-0.5 block text-[10px] text-amber-100/70">
              {t.clientWipeHint}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (user.email === "admin@emlakhub.net") return;
              deleteUser(user.id);
              pushAudit("admin", `Delete account: ${user.email}`, "warn");
              onDeleted?.();
              onClose();
            }}
            disabled={user.email === "admin@emlakhub.net"}
            className="w-full rounded-xl border border-rose-400/40 bg-rose-500/15 px-3 py-2.5 text-left text-[12px] text-rose-100 disabled:opacity-40"
          >
            Удалить аккаунт навсегда
            <span className="mt-0.5 block text-[10px] text-rose-100/60">
              Демо: запись исчезнет из списка пользователей
            </span>
          </button>
        </div>
      </aside>
    </div>
  );
}

function Info({ label, value, mono, danger }) {
  return (
    <div className="rounded-xl border border-white/[0.06] px-2.5 py-2">
      <div className="text-[9px] uppercase tracking-wide text-[#64748b]">
        {label}
      </div>
      <div
        className={[
          "mt-0.5 truncate text-[12px]",
          mono ? "font-mono" : "",
          danger ? "text-rose-300" : "text-[#e2e8f0]",
        ].join(" ")}
      >
        {value}
      </div>
    </div>
  );
}
