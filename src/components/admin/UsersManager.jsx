"use client";

/**
 * UsersManager — пользователи, роли, PRO, создание/удаление
 */

import { useMemo, useState } from "react";
import { ROLES, ROLE_LABELS } from "@/lib/firebase/constants";
import { useSystem } from "@/context/SystemContext";
import { useAuth } from "@/context/AuthContext";
import {
  PLANS,
  defaultSubscription,
  formatExpiry,
  isProActive,
} from "@/lib/subscription";

export default function UsersManager() {
  const { users, createUser, deleteUser, upsertUser } = useSystem();
  const { profile, updateLocalProfile } = useAuth();
  const [note, setNote] = useState("");
  const [form, setForm] = useState({
    email: "",
    displayName: "",
    role: ROLES.INVESTOR,
    plan: PLANS.FREE,
  });

  const stats = useMemo(() => {
    const pro = users.filter((u) => isProActive(u.subscription)).length;
    const blocked = users.filter((u) => u.blocked).length;
    return { total: users.length, pro, blocked, free: users.length - pro };
  }, [users]);

  const syncIfSelf = (user) => {
    if (profile?.email === user.email) {
      updateLocalProfile({
        role: user.role,
        blocked: user.blocked,
        subscription: user.subscription,
      });
    }
  };

  const onCreate = (e) => {
    e.preventDefault();
    if (!form.email.trim()) return;
    createUser(form);
    setForm({
      email: "",
      displayName: "",
      role: ROLES.INVESTOR,
      plan: PLANS.FREE,
    });
    setNote("Пользователь создан (демо)");
  };

  const setPlan = (user, plan) => {
    const subscription =
      plan === PLANS.PRO
        ? defaultSubscription(PLANS.PRO, 30)
        : defaultSubscription(PLANS.FREE);
    const next = { ...user, subscription };
    upsertUser(next);
    syncIfSelf(next);
    setNote(plan === PLANS.PRO ? "PRO на 30 дней" : "Переведён на Free");
  };

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#93c5fd]">
          Admin · users
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          Пользователи и подписки
        </h1>
        <p className="mt-1 text-[13px] text-[#9aa3ad]">
          Роли, блокировка, Free/PRO, регистрация и удаление.
        </p>
        {note ? (
          <p className="mt-2 text-[12px] text-emerald-400/90">{note}</p>
        ) : null}
      </header>

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Всего", stats.total],
          ["PRO", stats.pro],
          ["Free", stats.free],
          ["Blocked", stats.blocked],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-2xl border border-white/10 bg-[#0a0c12] px-4 py-3"
          >
            <div className="text-[10px] uppercase tracking-[0.14em] text-[#64748b]">
              {label}
            </div>
            <div className="mt-1 font-mono text-[22px] text-white">{value}</div>
          </div>
        ))}
      </div>

      <form
        onSubmit={onCreate}
        className="grid gap-3 rounded-2xl border border-white/10 bg-[#0a0c12] p-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <input
          className="eh-term-input lg:col-span-2"
          placeholder="email@…"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
        />
        <input
          className="eh-term-input"
          placeholder="Имя"
          value={form.displayName}
          onChange={(e) =>
            setForm((f) => ({ ...f, displayName: e.target.value }))
          }
        />
        <select
          className="eh-term-input"
          value={form.role}
          onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
        >
          {Object.values(ROLES).map((r) => (
            <option key={r} value={r}>
              {ROLE_LABELS[r]}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-[13px] font-semibold text-white"
        >
          Зарегистрировать
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-[0.16em] text-[#6b7280]">
              <th className="px-4 py-3 font-medium">Пользователь</th>
              <th className="px-4 py-3 font-medium">Роль</th>
              <th className="px-4 py-3 font-medium">Подписка</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const pro = isProActive(u.subscription);
              return (
                <tr key={u.id} className="border-b border-white/10">
                  <td className="px-4 py-3">
                    <div className="text-white">{u.displayName || "-"}</div>
                    <div className="text-[11px] text-[#6b7280]">{u.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role}
                      onChange={(e) => {
                        const next = { ...u, role: e.target.value };
                        upsertUser(next);
                        syncIfSelf(next);
                        setNote("Роль обновлена");
                      }}
                      className="eh-term-input py-1.5 text-[12px]"
                    >
                      {Object.values(ROLES).map((r) => (
                        <option key={r} value={r}>
                          {ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div
                      className={
                        pro
                          ? "font-mono text-[11px] text-emerald-400"
                          : "font-mono text-[11px] text-amber-300"
                      }
                    >
                      {pro ? "PRO" : "FREE"}
                    </div>
                    <div className="text-[10px] text-[#64748b]">
                      {pro
                        ? formatExpiry(u.subscription?.expiresAt, "ru")
                        : "лимит 2 карты"}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        u.blocked
                          ? "font-mono text-[11px] text-red-400"
                          : "font-mono text-[11px] text-emerald-400"
                      }
                    >
                      {u.blocked ? "blocked" : "active"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          const next = { ...u, blocked: !u.blocked };
                          upsertUser(next);
                          syncIfSelf(next);
                        }}
                        className="eh-term-btn-ghost text-[11px]"
                      >
                        {u.blocked ? "Разблок" : "Блок"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPlan(u, pro ? PLANS.FREE : PLANS.PRO)}
                        className="eh-term-btn-ghost text-[11px]"
                      >
                        {pro ? "→ Free" : "→ PRO"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (u.email === "admin@emlakhub.net") {
                            setNote("Системного админа удалить нельзя");
                            return;
                          }
                          deleteUser(u.id);
                          setNote("Удалён");
                        }}
                        className="eh-term-btn-ghost text-[11px] text-rose-300"
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
