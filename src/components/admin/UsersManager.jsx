"use client";

/**
 * =============================================================================
 * UsersManager — роли + блокировка (Firestore / DEMO)
 * =============================================================================
 */

import { useEffect, useState } from "react";
import {
  listUsers,
  setUserRole,
  setUserBlocked,
} from "@/lib/firebase/firestore";
import { ROLES, ROLE_LABELS } from "@/lib/firebase/constants";

export default function UsersManager() {
  const [users, setUsers] = useState([]);
  const [busyId, setBusyId] = useState("");
  const [note, setNote] = useState("");

  const load = async () => {
    const rows = await listUsers();
    setUsers(rows);
  };

  useEffect(() => {
    load();
  }, []);

  const changeRole = async (uid, role) => {
    setBusyId(uid);
    setNote("");
    await setUserRole(uid, role);
    setUsers((prev) => prev.map((u) => (u.id === uid ? { ...u, role } : u)));
    setNote("Роль обновлена");
    setBusyId("");
  };

  const toggleBlock = async (uid, blocked) => {
    setBusyId(uid);
    setNote("");
    await setUserBlocked(uid, blocked);
    setUsers((prev) =>
      prev.map((u) => (u.id === uid ? { ...u, blocked } : u))
    );
    setNote(blocked ? "Аккаунт заблокирован" : "Аккаунт разблокирован");
    setBusyId("");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#b8956c]">
          Admin · users
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-white">
          Управление пользователями
        </h1>
        <p className="mt-1 text-[13px] text-[#9aa3ad]">
          Роли: Админ · Разработчик · Инвестор. Блокировка отключает терминал.
        </p>
        {note ? (
          <p className="mt-2 text-[12px] text-emerald-400/90">{note}</p>
        ) : null}
      </header>

      <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-[0.16em] text-[#6b7280]">
              <th className="px-4 py-3 font-medium">Пользователь</th>
              <th className="px-4 py-3 font-medium">Роль</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-white/10">
                <td className="px-4 py-3">
                  <div className="text-white">{u.displayName || "-"}</div>
                  <div className="text-[11px] text-[#6b7280]">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={busyId === u.id}
                    onChange={(e) => changeRole(u.id, e.target.value)}
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
                  <button
                    type="button"
                    disabled={busyId === u.id}
                    onClick={() => toggleBlock(u.id, !u.blocked)}
                    className="eh-term-btn-ghost text-[11px]"
                  >
                    {u.blocked ? "Разблокировать" : "Заблокировать"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
