"use client";

/**
 * UsersManager - клиенты (инвесторы): статусы, IP, risk, CRUD, 360°
 * Сотрудники админки - отдельно в /admin/staff
 */

import { useMemo, useState } from "react";
import Link from "next/link";
import { ROLES } from "@/lib/roles";
import { useSystem } from "@/context/SystemContext";
import { useAuth } from "@/context/AuthContext";
import {
  PLANS,
  defaultSubscription,
  formatExpiry,
  isProActive,
  daysLeft,
  adjustSubscriptionDays,
} from "@/lib/subscription";
import TermHint from "@/components/terminal/TermHint";
import Client360 from "@/components/admin/Client360";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";
import { downloadCsv } from "@/lib/csvExport";
import {
  ACCOUNT_STATUSES,
  accountStatusMeta,
  resolveAccountStatus,
} from "@/lib/fraudIntel";
import { useUsers } from "@/hooks/useUsers";
import { useSupportDesk } from "@/hooks/useSupportDesk";
import { personLabel, presenceMeta } from "@/lib/staffProfile";
import UserAvatar from "@/components/terminal/UserAvatar";

export default function UsersManager() {
  const { fraudCases, pushAudit } = useSystem();
  const { tickets } = useSupportDesk();
  const {
    users: apiUsers,
    configured: dbOk,
    create: apiCreate,
    update: apiUpdate,
    remove: apiRemove,
    wipe: apiWipe,
    reload: reloadUsers,
  } = useUsers({ role: ROLES.INVESTOR });
  const users = useMemo(() => (dbOk ? apiUsers : []), [dbOk, apiUsers]);
  const createUser = async (payload) => {
    if (!dbOk) {
      pushAudit("admin", "Need DATABASE_URL to create users", "warn");
      return null;
    }
    return apiCreate({
      ...payload,
      password: payload.password,
      role: ROLES.INVESTOR,
    });
  };
  const upsertUser = async (next) => {
    if (!dbOk || !next?.id) return;
    await apiUpdate(next.id, {
      displayName: next.displayName,
      firstName: next.firstName,
      lastName: next.lastName,
      phone: next.phone,
      company: next.company,
      blocked: next.blocked,
      subscriptionPlan: next.subscription?.plan,
      subscriptionStartsAt: next.subscription?.startsAt ?? null,
      subscriptionExpiresAt: next.subscription?.expiresAt ?? null,
      lastIp: next.lastIp,
      lastGeo: next.lastGeo,
    });
  };
  const deleteUser = async (id) => {
    if (!dbOk) return;
    await apiRemove(id);
  };
  const wipeUserSensitive = async (id) => {
    if (!dbOk) return;
    await apiWipe(id);
  };
  const { profile, updateLocalProfile } = useAuth();
  const { t, locale } = useAdminI18n();
  const [note, setNote] = useState("");
  const [danger, setDanger] = useState("");
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [clientId, setClientId] = useState(null);
  const [weekCutoff] = useState(() => Date.now() - 86400000 * 7);
  const [form, setForm] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phone: "",
    company: "",
    role: ROLES.INVESTOR,
    plan: PLANS.FREE,
    accountStatus: "active",
    lastIp: "",
    lastGeo: "Baku, AZ",
  });

  const clients = useMemo(
    () => users.filter((u) => u.role === ROLES.INVESTOR),
    [users]
  );

  const stats = useMemo(() => {
    const pro = clients.filter((u) => isProActive(u.subscription)).length;
    const blocked = clients.filter(
      (u) => resolveAccountStatus(u) === "blocked"
    ).length;
    const review = clients.filter(
      (u) => resolveAccountStatus(u) === "review"
    ).length;
    const risk = clients.filter(
      (u) => resolveAccountStatus(u) === "risk"
    ).length;
    const activeOpenTickets = tickets.filter((x) => x.status !== "closed").length;
    const fraudOpen = fraudCases.filter((f) => f.status !== "cleared").length;
    const newWeek = clients.filter((u) => (u.createdAt || 0) > weekCutoff).length;
    return {
      total: clients.length,
      pro,
      blocked,
      review,
      risk,
      free: clients.length - pro,
      newWeek,
      activeOpenTickets,
      fraudOpen,
    };
  }, [clients, tickets, fraudCases, weekCutoff]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return clients.filter((u) => {
      if (
        statusFilter !== "all" &&
        resolveAccountStatus(u) !== statusFilter
      )
        return false;
      if (!qq) return true;
      const hay = [
        u.email,
        u.displayName,
        u.firstName,
        u.lastName,
        u.phone,
        u.company,
        u.lastIp,
        u.lastGeo,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(qq);
    });
  }, [clients, q, statusFilter]);

  const syncIfSelf = (user) => {
    if (profile?.email === user.email) {
      updateLocalProfile({
        role: user.role,
        blocked: user.blocked,
        subscription: user.subscription,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: user.displayName,
      });
    }
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.email.trim()) {
      setNote("Укажите email");
      return;
    }
    if (!dbOk) {
      setNote(
        "PostgreSQL не подключена. Проверьте .env.local (DATABASE_URL) и перезапустите npm run dev. Войдите как admin@emlak.az"
      );
      return;
    }
    try {
      const created = await createUser({
        ...form,
        role: ROLES.INVESTOR,
        password: form.password,
      });
      if (!created) {
        setNote("Не удалось создать — нет ответа API");
        return;
      }
      if (form.plan === PLANS.PRO && created.id) {
        const subscription = defaultSubscription(PLANS.PRO, 30);
        await apiUpdate(created.id, {
          subscriptionPlan: PLANS.PRO,
          subscriptionStartsAt: subscription.startsAt,
          subscriptionExpiresAt: subscription.expiresAt,
        });
        await reloadUsers();
      }
      setForm({
        email: "",
        password: "",
        firstName: "",
        lastName: "",
        phone: "",
        company: "",
        role: ROLES.INVESTOR,
        plan: PLANS.FREE,
        accountStatus: "active",
        lastIp: "",
        lastGeo: "Baku, AZ",
      });
      setNote(
        `Клиент создан. Пароль передайте отдельно: ${form.email.trim().toLowerCase()}`
      );
    } catch (err) {
      setNote(err.message || "Ошибка создания");
    }
  };

  const setPlan = async (user, plan) => {
    const subscription =
      plan === PLANS.PRO
        ? defaultSubscription(PLANS.PRO, 30)
        : defaultSubscription(PLANS.FREE);
    const next = { ...user, subscription };
    await upsertUser(next);
    syncIfSelf(next);
    setNote(plan === PLANS.PRO ? "PRO на 30 дней" : "Переведён на Free");
  };

  const setStatus = async (user, statusId) => {
    const next = {
      ...user,
      accountStatus: statusId,
      blocked: statusId === "blocked",
    };
    await upsertUser(next);
    syncIfSelf(next);
    pushAudit?.(profile?.email, `Status ${statusId} → ${user.email}`, "warn");
    setNote(`Статус: ${accountStatusMeta(statusId, locale).label}`);
  };

  return (
    <div className="max-w-6xl space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#78716c]">
            Admin · users
          </p>
          <h1 className="mt-1 text-[22px] font-semibold tracking-tight text-white">
            {t.usersTitle}
          </h1>
          <p className="mt-1 text-[13px] text-[#9aa3ad]">
            {t.usersHint}{" "}
            <Link href="/admin/staff" className="text-sky-300 underline">
              {t.staffTitle || "Сотрудники"} →
            </Link>
          </p>
          {note ? (
            <p
              className={[
                "mt-2 text-[12px]",
                note.toLowerCase().includes("ошиб") ||
                note.includes("Нужен") ||
                note.includes("не подключена") ||
                note.includes("Не удалось")
                  ? "text-rose-300"
                  : "text-emerald-400/90",
              ].join(" ")}
            >
              {note}
            </p>
          ) : null}
          {dbOk === false ? (
            <p className="mt-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[12px] text-amber-100">
              База не настроена. Проверьте DATABASE_URL и перезапустите сервер.
            </p>
          ) : dbOk ? (
            <p className="mt-2 text-[11px] text-emerald-400/80">
              PostgreSQL · подключена
            </p>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-xl border border-white/10 px-3 py-2 text-[12px] text-[#9aa3ad]"
          onClick={() =>
            downloadCsv(
              "clients.csv",
              clients.map((u) => ({
                email: u.email,
                name: personLabel(u),
                status: resolveAccountStatus(u),
                plan: u.subscription?.plan,
                ip: u.lastIp,
                geo: u.lastGeo,
                device: u.lastDevice,
                risk: u.riskScore,
                payments: u.paymentAttempts,
                phone: u.phone,
                blocked: u.blocked,
              }))
            )
          }
        >
          {t.exportCsv}
        </button>
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 border-y border-white/[0.08] py-4 sm:grid-cols-5">
        {[
          ["Всего", stats.total],
          ["PRO", stats.pro],
          ["На проверке", stats.review],
          ["Риск", stats.risk],
          ["Blocked", stats.blocked],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-[11px] uppercase tracking-[0.14em] text-[#78716c]">
              {label}
            </dt>
            <dd className="eh-num mt-1 font-mono text-[22px] text-white">{value}</dd>
          </div>
        ))}
      </dl>

      <form
        onSubmit={onCreate}
        className="space-y-3 border-b border-white/[0.08] pb-5"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[14px] font-semibold text-white">
            Добавить клиента
          </h2>
          <TermHint text="Только инвесторы терминала. Сотрудников админки добавляйте в «Сотрудники»." />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className="eh-term-input"
            placeholder="email@…"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            className="eh-term-input"
            type="text"
            placeholder="Пароль (вход клиента)"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
            required
          />
          <input
            className="eh-term-input"
            placeholder="Имя"
            value={form.firstName}
            onChange={(e) =>
              setForm((f) => ({ ...f, firstName: e.target.value }))
            }
          />
          <input
            className="eh-term-input"
            placeholder="Фамилия"
            value={form.lastName}
            onChange={(e) =>
              setForm((f) => ({ ...f, lastName: e.target.value }))
            }
          />
          <input
            className="eh-term-input"
            placeholder="Телефон"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <input
            className="eh-term-input"
            placeholder="Компания"
            value={form.company}
            onChange={(e) =>
              setForm((f) => ({ ...f, company: e.target.value }))
            }
          />
          <select
            className="eh-term-input"
            value={form.plan}
            onChange={(e) => setForm((f) => ({ ...f, plan: e.target.value }))}
          >
            <option value={PLANS.FREE}>Free</option>
            <option value={PLANS.PRO}>PRO</option>
          </select>
          <select
            className="eh-term-input"
            value={form.accountStatus}
            onChange={(e) =>
              setForm((f) => ({ ...f, accountStatus: e.target.value }))
            }
          >
            {ACCOUNT_STATUSES.map((s) => (
              <option key={s.id} value={s.id}>
                {accountStatusMeta(s.id, locale).label}
              </option>
            ))}
          </select>
          <input
            className="eh-term-input"
            placeholder="IP (опц.)"
            value={form.lastIp}
            onChange={(e) => setForm((f) => ({ ...f, lastIp: e.target.value }))}
          />
          <input
            className="eh-term-input"
            placeholder="Geo"
            value={form.lastGeo}
            onChange={(e) =>
              setForm((f) => ({ ...f, lastGeo: e.target.value }))
            }
          />
          <button
            type="submit"
            className="eh-press rounded-lg bg-[#2563eb] px-4 py-2.5 text-[13px] font-medium text-white hover:bg-[#1d4ed8] lg:col-span-2"
          >
            Создать клиента
          </button>
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <input
          className="eh-term-input max-w-xs flex-1"
          placeholder="Поиск: email, имя, IP, телефон…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="eh-term-input w-auto"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">Все статусы</option>
          {ACCOUNT_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {accountStatusMeta(s.id, locale).label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-[0.14em] text-[#78716c]">
              <th className="px-3 py-3 font-medium">Клиент</th>
              <th className="px-3 py-3 font-medium">Статус</th>
              <th className="px-3 py-3 font-medium">IP / Geo</th>
              <th className="px-3 py-3 font-medium">Device</th>
              <th className="px-3 py-3 font-medium">Risk</th>
              <th className="px-3 py-3 font-medium">План</th>
              <th className="px-3 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => {
              const pro = isProActive(u.subscription);
              const st = accountStatusMeta(resolveAccountStatus(u), locale);
              const pm = presenceMeta(u.presence || "offline", locale);
              return (
                <tr key={u.id} className="border-b border-white/[0.06] align-top">
                  <td className="px-3 py-3">
                    <div className="flex items-start gap-2">
                      <UserAvatar
                        name={personLabel(u)}
                        avatarId={u.avatarId || "slate"}
                        size="sm"
                        status={u.presence ? pm.color : undefined}
                      />
                      <div>
                        <div className="font-medium text-white">
                          {personLabel(u)}
                        </div>
                        <div className="text-[11px] text-[#6b7280]">
                          {u.email}
                        </div>
                        {u.phone ? (
                          <div className="text-[10px] text-[#64748b]">
                            {u.phone}
                          </div>
                        ) : null}
                        {u.company ? (
                          <div className="text-[10px] text-[#64748b]">
                            {u.company}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <select
                      className={`rounded-lg border-0 px-2 py-1 text-[11px] ${st.cls}`}
                      value={resolveAccountStatus(u)}
                      onChange={(e) => setStatus(u, e.target.value)}
                    >
                      {ACCOUNT_STATUSES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {accountStatusMeta(s.id, locale).label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-mono text-[11px] text-[#e2e8f0]">
                      {u.lastIp || "-"}
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      {u.lastGeo || "-"}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-[11px] text-[#9aa3ad]">
                    {u.lastDevice || "-"}
                    {u.paymentAttempts ? (
                      <div className="mt-0.5 font-mono text-[10px] text-amber-300">
                        {u.paymentAttempts} pay tries
                      </div>
                    ) : null}
                    {u.failedLogins ? (
                      <div className="font-mono text-[10px] text-rose-300">
                        {u.failedLogins} fail login
                      </div>
                    ) : null}
                  </td>
                  <td className="px-3 py-3">
                    <span
                      className={[
                        "font-mono text-[12px]",
                        (u.riskScore || 0) >= 70
                          ? "text-rose-300"
                          : (u.riskScore || 0) >= 40
                            ? "text-amber-300"
                            : "text-emerald-300",
                      ].join(" ")}
                    >
                      {u.riskScore ?? 0}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div
                      className={
                        pro
                          ? "font-mono text-[11px] text-emerald-400"
                          : "font-mono text-[11px] text-amber-300"
                      }
                    >
                      {pro ? "PRO" : "FREE"}
                      {pro && daysLeft(u.subscription) != null
                        ? ` · ${daysLeft(u.subscription)}д`
                        : ""}
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      {pro && u.subscription?.startsAt
                        ? `${formatExpiry(u.subscription.startsAt, "ru")} → ${formatExpiry(u.subscription.expiresAt, "ru")}`
                        : pro
                          ? formatExpiry(u.subscription?.expiresAt, "ru")
                          : "без доступа к лотам"}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {[7, 30, 90].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={async () => {
                            const subscription = adjustSubscriptionDays(
                              u.subscription,
                              d
                            );
                            const next = { ...u, subscription };
                            await upsertUser(next);
                            syncIfSelf(next);
                            setNote(`+${d}д PRO → ${u.email}`);
                          }}
                          className="rounded-md border border-emerald-400/25 px-1.5 py-0.5 font-mono text-[9px] text-emerald-200"
                        >
                          +{d}д
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => setClientId(u.id)}
                        className="eh-term-btn-ghost text-[11px] text-sky-300"
                      >
                        360°
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPlan(u, pro ? PLANS.FREE : PLANS.PRO)
                        }
                        className="eh-term-btn-ghost text-[11px]"
                      >
                        {pro ? "→ Free" : "→ PRO"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const key = `${u.id}:wipe`;
                          if (danger !== key) {
                            setDanger(key);
                            return;
                          }
                          wipeUserSensitive(u.id, [
                            "usage",
                            "notes",
                            "phone",
                            "company",
                            "sessions",
                          ]);
                          setDanger("");
                          setNote(`Wipe: ${u.email}`);
                        }}
                        className="eh-term-btn-ghost text-[11px] text-[#a8a29e]"
                      >
                        {danger === `${u.id}:wipe` ? "Подтвердить wipe" : "Wipe"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const key = `${u.id}:delete`;
                          if (danger !== key) {
                            setDanger(key);
                            return;
                          }
                          deleteUser(u.id);
                          setDanger("");
                          setNote("Клиент удалён");
                        }}
                        className="eh-term-btn-ghost text-[11px] text-[#f0b4b4]"
                      >
                        {danger === `${u.id}:delete` ? "Подтвердить" : "Удалить"}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!filtered.length ? (
          <p className="p-8 text-center text-[13px] text-[#64748b]">
            {clients.length === 0
              ? "Клиентов пока нет"
              : "Клиентов с таким фильтром нет"}
          </p>
        ) : null}
      </div>

      {clientId ? (
        <Client360
          user={users.find((u) => u.id === clientId)}
          onClose={() => setClientId(null)}
          onUserChange={() => reloadUsers()}
          onDeleted={() => {
            setClientId(null);
            setNote("Аккаунт удалён");
            reloadUsers();
          }}
        />
      ) : null}
    </div>
  );
}
