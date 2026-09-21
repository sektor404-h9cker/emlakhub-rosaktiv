"use client";

/**
 * SecurityPanel — безопасность платформы (админка)
 */

import { useMemo, useState } from "react";
import { Shield, KeyRound, Eye, AlertTriangle } from "lucide-react";
import { useSystem } from "@/context/SystemContext";
import { useAuth } from "@/context/AuthContext";
import { ROLE_PRIVILEGES } from "@/lib/adminPrivileges";
import { ROLE_LABELS } from "@/lib/firebase/constants";

const AUDIT_SEED = [
  { id: 1, at: "сегодня 02:14", who: "admin@emlakhub.net", action: "Вход в админку" },
  { id: 2, at: "сегодня 01:50", who: "system", action: "Шаблон «Техработы» снят" },
  { id: 3, at: "вчера", who: "support@emlakhub.net", action: "Ответ в тикете T-1042" },
];

export default function SecurityPanel() {
  const { users, system } = useSystem();
  const { profile } = useAuth();
  const [forceLogout, setForceLogout] = useState(false);
  const [audit] = useState(AUDIT_SEED);

  const blocked = useMemo(
    () => users.filter((u) => u.blocked).length,
    [users]
  );

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#93c5fd]">
          Admin · security
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
          <Shield size={22} className="text-[#60a5fa]" />
          Безопасность
        </h1>
        <p className="mt-1 text-[13px] text-[#9aa3ad]">
          Сессии, роли, аудит и быстрые меры при инциденте.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-3">
        <Stat
          icon={KeyRound}
          label="Текущий админ"
          value={profile?.email || "—"}
        />
        <Stat icon={Eye} label="Заблокировано" value={String(blocked)} />
        <Stat
          icon={AlertTriangle}
          label="Статус системы"
          value={system.status}
        />
      </div>

      <section className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
        <h2 className="text-[14px] font-semibold text-white">
          Матрица привилегий
        </h2>
        <div className="mt-3 space-y-2">
          {Object.entries(ROLE_PRIVILEGES).map(([role, list]) => (
            <div
              key={role}
              className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.06] px-3 py-2"
            >
              <span className="w-28 text-[12px] font-medium text-white">
                {ROLE_LABELS[role] || role}
              </span>
              {list.length === 0 ? (
                <span className="text-[11px] text-[#64748b]">нет доступа в /admin</span>
              ) : (
                list.map((p) => (
                  <span
                    key={p}
                    className="rounded-md bg-white/[0.05] px-2 py-0.5 font-mono text-[10px] text-[#93c5fd]"
                  >
                    {p}
                  </span>
                ))
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
        <h2 className="text-[14px] font-semibold text-white">Быстрые меры</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setForceLogout(true)}
            className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-4 py-2 text-[12px] font-medium text-amber-100"
          >
            Запросить повторный вход у всех (демо)
          </button>
          <a
            href="/admin/system"
            className="rounded-xl border border-rose-400/40 bg-rose-500/10 px-4 py-2 text-[12px] font-medium text-rose-100"
          >
            Аварийное отключение → Система
          </a>
        </div>
        {forceLogout ? (
          <p className="mt-3 text-[12px] text-emerald-400">
            Флаг выставлен в демо. В проде — инвалидация refresh-токенов.
          </p>
        ) : null}
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
        <h2 className="text-[14px] font-semibold text-white">Журнал аудита</h2>
        <ul className="mt-3 space-y-2">
          {audit.map((row) => (
            <li
              key={row.id}
              className="flex flex-wrap items-baseline justify-between gap-2 rounded-xl border border-white/[0.05] px-3 py-2 text-[12px]"
            >
              <span className="text-white">{row.action}</span>
              <span className="text-[#64748b]">
                {row.who} · {row.at}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
      <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.14em] text-[#64748b]">
        <Icon size={14} />
        {label}
      </div>
      <div className="mt-2 truncate text-[15px] font-medium text-white">
        {value}
      </div>
    </div>
  );
}
