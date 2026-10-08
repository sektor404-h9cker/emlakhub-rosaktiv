"use client";

/**
 * StaffManager - сотрудники админки (не инвесторы): CRUD + логин в демо
 */

import { useMemo, useState } from "react";
import { ROLES, ADMIN_ROLES } from "@/lib/roles";
import { useSystem } from "@/context/SystemContext";
import { useAuth } from "@/context/AuthContext";
import { PLANS, defaultSubscription } from "@/lib/subscription";
import { PRIV_LABELS } from "@/lib/adminPrivileges";
import TermHint from "@/components/terminal/TermHint";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";
import { downloadCsv } from "@/lib/csvExport";
import {
  ACCOUNT_STATUSES,
  accountStatusMeta,
  resolveAccountStatus,
} from "@/lib/fraudIntel";
import { personLabel, presenceMeta, PRESENCE } from "@/lib/staffProfile";
import { DEPARTMENTS, deptLabel } from "@/lib/adminDepartments";
import UserAvatar from "@/components/terminal/UserAvatar";
import { upsertDemoLogin, removeDemoLogin } from "@/lib/demoLogins";
import { useUsers } from "@/hooks/useUsers";
import { AVATAR_PRESETS } from "@/data/avatars";

const PROTECTED = new Set([
  "admin@emlakhub.net",
  "admin@emlak.az",
]);

function canChangeRole(email, nextRole) {
  const e = String(email || "").toLowerCase();
  if (PROTECTED.has(e) && nextRole !== ROLES.ADMIN) return false;
  return true;
}

export default function StaffManager() {
  const { roleLabels, privilegeMatrix, pushAudit } = useSystem();
  const {
    users: apiUsers,
    configured: dbOk,
    create: apiCreate,
    update: apiUpdate,
    remove: apiRemove,
  } = useUsers();
  const users = useMemo(
    () =>
      dbOk ? apiUsers.filter((u) => u.role !== ROLES.INVESTOR) : [],
    [dbOk, apiUsers]
  );
  const createUser = async (payload) => {
    if (!dbOk) return null;
    if (!payload.password || String(payload.password).length < 8) return null;
    return apiCreate(payload);
  };
  const upsertUser = async (next) => {
    if (!dbOk || !next?.id) return;
    await apiUpdate(next.id, {
      displayName: next.displayName,
      firstName: next.firstName,
      lastName: next.lastName,
      phone: next.phone,
      jobTitle: next.jobTitle,
      department: next.department,
      role: next.role,
      blocked: next.blocked,
      presence: next.presence,
      avatarId: next.avatarId,
      lastIp: next.lastIp,
      lastGeo: next.lastGeo,
    });
  };
  const deleteUser = async (id) => {
    if (!dbOk) return;
    await apiRemove(id);
  };
  const { profile, updateLocalProfile } = useAuth();
  const { t, locale } = useAdminI18n();
  const [note, setNote] = useState("");
  const [q, setQ] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [detailId, setDetailId] = useState(null);
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    jobTitle: "",
    department: "ops",
    role: ROLES.SUPPORT,
    password: "",
    presence: "online",
    avatarId: "ocean",
    lastIp: "",
    lastGeo: "Baku, AZ",
  });

  const staff = useMemo(
    () => users.filter((u) => u.role !== ROLES.INVESTOR),
    [users]
  );

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return staff.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (!qq) return true;
      return [u.email, u.displayName, u.firstName, u.lastName, u.phone, u.jobTitle]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .includes(qq);
    });
  }, [staff, q, roleFilter]);

  const detail = staff.find((u) => u.id === detailId) || null;
  const formPrivs = privilegeMatrix[form.role] || [];

  const syncLogin = (row, password) => {
    if (process.env.NODE_ENV === "production") return;
    if (process.env.NEXT_PUBLIC_ALLOW_DEMO !== "1") return;
    upsertDemoLogin({
      email: row.email,
      password,
      role: row.role,
      firstName: row.firstName,
      lastName: row.lastName,
      displayName: row.displayName,
      jobTitle: row.jobTitle,
      department: row.department,
      presence: row.presence,
      avatarId: row.avatarId,
      subscription: row.subscription || defaultSubscription(PLANS.PRO),
    });
  };

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.email.trim() || !form.firstName.trim()) return;
    if (!form.password || form.password.length < 8) {
      setNote("Пароль сотрудника — не короче 8 символов.");
      return;
    }
    if (!ADMIN_ROLES.includes(form.role)) return;
    if (!dbOk) {
      setNote("Нужен DATABASE_URL — сотрудники только в PostgreSQL.");
      return;
    }
    const row = await createUser({
      ...form,
      displayName: `${form.firstName} ${form.lastName}`.trim(),
      role: form.role,
    });
    if (!row) return;
    syncLogin(row, form.password);
    pushAudit?.(
      profile?.email,
      `Staff created: ${form.email} · ${form.role}`,
      "warn"
    );
    setNote(`Сотрудник создан: ${form.email.trim().toLowerCase()}`);
    setForm({
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      jobTitle: "",
      department: "ops",
      role: ROLES.SUPPORT,
      password: "",
      presence: "online",
      avatarId: "ocean",
      lastIp: "",
      lastGeo: "Baku, AZ",
    });
  };

  const onDelete = (u) => {
    if (PROTECTED.has(u.email)) {
      setNote("Системного сотрудника удалить нельзя");
      return;
    }
    deleteUser(u.id);
    removeDemoLogin(u.email);
    pushAudit?.(profile?.email, `Staff deleted: ${u.email}`, "warn");
    if (detailId === u.id) setDetailId(null);
    setNote(`Удалён: ${u.email}`);
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#93c5fd]">
            Admin · staff
          </p>
          <h1 className="mt-1 text-2xl font-semibold text-white">
            {t.staffTitle || "Сотрудники"}
          </h1>
          <p className="mt-1 text-[13px] text-[#9aa3ad]">
            {t.staffHint ||
              "Команда админки: роли, доступ, логин. Клиенты - в разделе «Клиенты»."}
          </p>
          {note ? (
            <p className="mt-2 text-[12px] text-emerald-400/90">{note}</p>
          ) : null}
        </div>
        <button
          type="button"
          className="rounded-xl border border-white/10 px-3 py-2 text-[12px] text-[#9aa3ad]"
          onClick={() =>
            downloadCsv(
              "staff.csv",
              staff.map((u) => ({
                email: u.email,
                name: personLabel(u),
                role: u.role,
                dept: u.department,
                title: u.jobTitle,
                phone: u.phone,
                ip: u.lastIp,
                status: resolveAccountStatus(u),
              }))
            )
          }
        >
          {t.exportCsv}
        </button>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          ["Всего", staff.length],
          ["Админы", staff.filter((u) => u.role === ROLES.ADMIN).length],
          [
            "На месте",
            staff.filter((u) => (u.presence || "online") === "online").length,
          ],
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
        className="space-y-3 rounded-2xl border border-sky-400/25 bg-sky-500/[0.05] p-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-[14px] font-semibold text-white">
            Добавить сотрудника
          </h2>
          <TermHint text="После создания можно сразу войти в админку с указанным email и паролем (демо)." />
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className="eh-term-input"
            placeholder="email@emlakhub.net"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
          />
          <input
            className="eh-term-input"
            placeholder="Имя"
            value={form.firstName}
            onChange={(e) =>
              setForm((f) => ({ ...f, firstName: e.target.value }))
            }
            required
          />
          <input
            className="eh-term-input"
            placeholder="Фамилия"
            value={form.lastName}
            onChange={(e) =>
              setForm((f) => ({ ...f, lastName: e.target.value }))
            }
            required
          />
          <input
            className="eh-term-input"
            placeholder="Пароль для входа"
            value={form.password}
            onChange={(e) =>
              setForm((f) => ({ ...f, password: e.target.value }))
            }
          />
          <input
            className="eh-term-input"
            placeholder="Должность"
            value={form.jobTitle}
            onChange={(e) =>
              setForm((f) => ({ ...f, jobTitle: e.target.value }))
            }
          />
          <input
            className="eh-term-input"
            placeholder="Телефон"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <select
            className="eh-term-input"
            value={form.role}
            onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
          >
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {roleLabels[r] || r}
              </option>
            ))}
          </select>
          <select
            className="eh-term-input"
            value={form.department}
            onChange={(e) =>
              setForm((f) => ({ ...f, department: e.target.value }))
            }
          >
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {deptLabel(d.id, locale)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-[13px] font-semibold text-white lg:col-span-2"
          >
            Создать и выдать доступ
          </button>
        </div>
        <div className="rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-[12px] text-[#9aa3ad]">
          Разделы роли «{roleLabels[form.role]}»:{" "}
          {formPrivs.length
            ? formPrivs.map((p) => PRIV_LABELS[p] || p).join(", ")
            : "-"}
        </div>
      </form>

      <div className="flex flex-wrap gap-2">
        <input
          className="eh-term-input max-w-xs flex-1"
          placeholder="Поиск сотрудника…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="eh-term-input w-auto"
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="all">Все роли</option>
          {ADMIN_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabels[r] || r}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-3 lg:grid-cols-[1fr_320px]">
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a0a0a]">
          <table className="w-full min-w-[720px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-[0.16em] text-[#6b7280]">
                <th className="px-3 py-3">Сотрудник</th>
                <th className="px-3 py-3">Роль / отдел</th>
                <th className="px-3 py-3">Статус</th>
                <th className="px-3 py-3">IP</th>
                <th className="px-3 py-3">Действия</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => {
                const pm = presenceMeta(u.presence || "online", locale);
                const st = accountStatusMeta(
                  resolveAccountStatus(u),
                  locale
                );
                return (
                  <tr
                    key={u.id}
                    className="border-b border-white/10 align-top"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-start gap-2">
                        <UserAvatar
                          name={personLabel(u)}
                          avatarId={u.avatarId || "slate"}
                          size="sm"
                          status={pm.color}
                        />
                        <div>
                          <div className="font-medium text-white">
                            {personLabel(u)}
                          </div>
                          <div className="text-[11px] text-[#6b7280]">
                            {u.email}
                          </div>
                          {u.jobTitle ? (
                            <div className="text-[10px] text-[#64748b]">
                              {u.jobTitle}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        className="eh-term-input py-1.5 text-[12px]"
                        value={u.role}
                        onChange={(e) => {
                          const nextRole = e.target.value;
                          if (!canChangeRole(u.email, nextRole)) {
                            setNote(
                              "Системного админа нельзя понизить до support — только admin."
                            );
                            return;
                          }
                          const next = { ...u, role: nextRole };
                          upsertUser(next);
                          syncLogin(next);
                          if (profile?.email === u.email) {
                            updateLocalProfile({ role: nextRole });
                          }
                        }}
                      >
                        {ADMIN_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {roleLabels[r] || r}
                          </option>
                        ))}
                      </select>
                      <div className="mt-1 text-[10px] text-[#64748b]">
                        {deptLabel(u.department || "ops", locale)}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] ${st.cls}`}
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ background: pm.color }}
                        />
                        {pm.label}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-mono text-[11px] text-[#e2e8f0]">
                        {u.lastIp || "-"}
                      </div>
                      <div className="text-[10px] text-[#64748b]">
                        {u.lastGeo || "-"}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex flex-wrap gap-1">
                        <button
                          type="button"
                          onClick={() => setDetailId(u.id)}
                          className="eh-term-btn-ghost text-[11px] text-sky-300"
                        >
                          Карточка
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(u)}
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

        <aside className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
          {!detail ? (
            <p className="text-[13px] text-[#64748b]">
              Выберите сотрудника - полная карточка
            </p>
          ) : (
            <StaffCard
              key={detail.id}
              user={detail}
              locale={locale}
              roleLabels={roleLabels}
              privilegeMatrix={privilegeMatrix}
              onSave={(patch) => {
                const next = { ...detail, ...patch };
                upsertUser(next);
                syncLogin(next);
                if (profile?.email === detail.email) {
                  updateLocalProfile(patch);
                }
                setNote("Сохранено");
              }}
              onDelete={() => onDelete(detail)}
            />
          )}
        </aside>
      </div>
    </div>
  );
}

function StaffCard({
  user,
  locale,
  roleLabels,
  privilegeMatrix,
  onSave,
  onDelete,
}) {
  const [draft, setDraft] = useState(() => user);
  const privs = privilegeMatrix[draft.role] || [];

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <UserAvatar
          name={personLabel(draft)}
          avatarId={draft.avatarId || "ocean"}
          size="lg"
          status={presenceMeta(draft.presence || "online", locale).color}
        />
        <div>
          <h2 className="text-[16px] font-semibold text-white">
            {personLabel(draft)}
          </h2>
          <p className="text-[12px] text-[#9aa3ad]">{draft.email}</p>
          <p className="mt-1 text-[11px] text-[#64748b]">
            {roleLabels[draft.role]} ·{" "}
            {deptLabel(draft.department || "ops", locale)}
          </p>
        </div>
      </div>

      <label className="block text-[11px] text-[#9aa3ad]">
        Имя
        <input
          className="eh-term-input mt-1"
          value={draft.firstName || ""}
          onChange={(e) =>
            setDraft((d) => ({ ...d, firstName: e.target.value }))
          }
        />
      </label>
      <label className="block text-[11px] text-[#9aa3ad]">
        Фамилия
        <input
          className="eh-term-input mt-1"
          value={draft.lastName || ""}
          onChange={(e) =>
            setDraft((d) => ({ ...d, lastName: e.target.value }))
          }
        />
      </label>
      <label className="block text-[11px] text-[#9aa3ad]">
        Должность
        <input
          className="eh-term-input mt-1"
          value={draft.jobTitle || ""}
          onChange={(e) =>
            setDraft((d) => ({ ...d, jobTitle: e.target.value }))
          }
        />
      </label>
      <label className="block text-[11px] text-[#9aa3ad]">
        Телефон
        <input
          className="eh-term-input mt-1"
          value={draft.phone || ""}
          onChange={(e) => setDraft((d) => ({ ...d, phone: e.target.value }))}
        />
      </label>
      <label className="block text-[11px] text-[#9aa3ad]">
        Отдел
        <select
          className="eh-term-input mt-1"
          value={draft.department || "ops"}
          onChange={(e) =>
            setDraft((d) => ({ ...d, department: e.target.value }))
          }
        >
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>
              {deptLabel(d.id, locale)}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-[11px] text-[#9aa3ad]">
        Статус присутствия
        <select
          className="eh-term-input mt-1"
          value={draft.presence || "online"}
          onChange={(e) =>
            setDraft((d) => ({ ...d, presence: e.target.value }))
          }
        >
          {PRESENCE.map((p) => (
            <option key={p.id} value={p.id}>
              {presenceMeta(p.id, locale).label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-[11px] text-[#9aa3ad]">
        Аккаунт
        <select
          className="eh-term-input mt-1"
          value={resolveAccountStatus(draft)}
          onChange={(e) =>
            setDraft((d) => ({
              ...d,
              accountStatus: e.target.value,
              blocked: e.target.value === "blocked",
            }))
          }
        >
          {ACCOUNT_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>
              {accountStatusMeta(s.id, locale).label}
            </option>
          ))}
        </select>
      </label>

      <div>
        <div className="text-[11px] text-[#9aa3ad]">Аватар</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {AVATAR_PRESETS.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setDraft((d) => ({ ...d, avatarId: a.id }))}
              className={
                draft.avatarId === a.id ? "ring-2 ring-sky-400 rounded-full" : ""
              }
            >
              <UserAvatar
                name={personLabel(draft)}
                avatarId={a.id}
                size="sm"
              />
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/10 px-3 py-2 text-[11px] text-[#9aa3ad]">
        Доступ: {privs.map((p) => PRIV_LABELS[p] || p).join(", ") || "-"}
      </div>

      <button
        type="button"
        onClick={() =>
          onSave({
            ...draft,
            displayName: personLabel(draft),
          })
        }
        className="w-full rounded-xl bg-[#2563eb] py-2.5 text-[13px] font-semibold text-white"
      >
        Сохранить
      </button>
      <button
        type="button"
        onClick={onDelete}
        className="w-full rounded-xl border border-rose-400/30 py-2 text-[12px] text-rose-200"
      >
        Удалить сотрудника
      </button>
    </div>
  );
}
