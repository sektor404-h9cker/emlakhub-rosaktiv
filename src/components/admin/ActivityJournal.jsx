"use client";

/**
 * ActivityJournal - журнал действий админки
 */

import { useMemo, useState } from "react";
import { ScrollText, Trash2, Pencil } from "lucide-react";
import { useSystem } from "@/context/SystemContext";

export default function ActivityJournal() {
  const {
    auditLogs,
    updateAuditLog,
    deleteAuditLog,
    clearAuditLogs,
  } = useSystem();
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("all");
  const [editId, setEditId] = useState(null);

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return auditLogs.filter((r) => {
      if (level !== "all" && r.level !== level) return false;
      if (!qq) return true;
      return (
        r.action?.toLowerCase().includes(qq) ||
        r.who?.toLowerCase().includes(qq)
      );
    });
  }, [auditLogs, q, level]);

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#93c5fd]">
            Admin · activity
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
            <ScrollText size={22} className="text-[#60a5fa]" />
            Журнал действий
          </h1>
          <p className="mt-1 text-[13px] text-[#9aa3ad]">
            Кто что сделал в админке. Можно править и чистить, чтобы не
            забивалось.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => clearAuditLogs(86400000 * 7)}
            className="rounded-xl border border-white/10 px-3 py-2 text-[12px] text-[#9aa3ad]"
          >
            Старше 7 дней
          </button>
          <button
            type="button"
            onClick={() => clearAuditLogs()}
            className="rounded-xl border border-rose-400/30 bg-rose-500/10 px-3 py-2 text-[12px] text-rose-100"
          >
            Очистить всё
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        <input
          className="eh-term-input max-w-sm flex-1"
          placeholder="Поиск по действию / кто"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="eh-term-input w-auto"
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        >
          <option value="all">Все уровни</option>
          <option value="info">info</option>
          <option value="warn">warn</option>
          <option value="ok">ok</option>
          <option value="critical">critical</option>
        </select>
      </div>

      <ul className="space-y-2">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-2xl border border-white/10 bg-[#0a0c12] px-4 py-3"
          >
            {editId === row.id ? (
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="eh-term-input flex-1 text-[13px]"
                  defaultValue={row.action}
                  id={`act-${row.id}`}
                />
                <button
                  type="button"
                  className="eh-term-btn-ghost text-[12px]"
                  onClick={() => {
                    const el = document.getElementById(`act-${row.id}`);
                    updateAuditLog(row.id, {
                      action: el?.value?.trim() || row.action,
                    });
                    setEditId(null);
                  }}
                >
                  Сохранить
                </button>
                <button
                  type="button"
                  className="eh-term-btn-ghost text-[12px]"
                  onClick={() => setEditId(null)}
                >
                  Отмена
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="text-[13px] text-white">{row.action}</div>
                  <div className="mt-1 font-mono text-[10px] text-[#64748b]">
                    {row.who} · {fmt(row.at)} · {row.level || "info"}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditId(row.id)}
                    className="text-[#93c5fd]"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteAuditLog(row.id)}
                    className="text-rose-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
        {!rows.length ? (
          <li className="py-10 text-center text-[13px] text-[#64748b]">
            Журнал пуст
          </li>
        ) : null}
      </ul>
    </div>
  );
}

function fmt(at) {
  if (!at) return "-";
  return new Date(at).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}
