"use client";

/**
 * =============================================================================
 * FinanceTable — оплаты, подписки, зависшие транзакции
 * =============================================================================
 */

import { useEffect, useState } from "react";
import { listPayments, updatePaymentStatus } from "@/lib/firebase/firestore";

const STATUS_META = {
  paid: { label: "оплачено", cls: "text-emerald-400" },
  pending: { label: "ожидание", cls: "text-amber-400" },
  stuck: { label: "зависло", cls: "text-red-400" },
  failed: { label: "ошибка", cls: "text-red-400" },
};

export default function FinanceTable() {
  const [rows, setRows] = useState([]);
  const [busyId, setBusyId] = useState("");

  useEffect(() => {
    listPayments().then(setRows);
  }, []);

  const setStatus = async (id, status) => {
    setBusyId(id);
    await updatePaymentStatus(id, status);
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    setBusyId("");
  };

  return (
    <div className="mx-auto max-w-5xl">
      <header className="mb-6">
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#b8956c]">
          Admin · finance
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-white">
          Финансовый блок
        </h1>
        <p className="mt-1 text-[13px] text-[#9aa3ad]">
          Подписки и статусы транзакций. Зависшие — выделить и закрыть вручную.
        </p>
      </header>

      <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#0a0a0a]">
        <table className="w-full min-w-[640px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-[0.16em] text-[#6b7280]">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Клиент</th>
              <th className="px-4 py-3 font-medium">План</th>
              <th className="px-4 py-3 font-medium">Сумма</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Действие</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const meta = STATUS_META[r.status] || STATUS_META.pending;
              return (
                <tr key={r.id} className="border-b border-white/10">
                  <td className="px-4 py-3 font-mono text-[11px] text-[#9aa3ad]">
                    {r.id}
                  </td>
                  <td className="px-4 py-3 text-white">{r.userEmail}</td>
                  <td className="px-4 py-3 text-[#c4c8ce]">{r.plan}</td>
                  <td className="px-4 py-3 font-mono tabular-nums text-white">
                    ₼ {Number(r.amount).toLocaleString("en-US")}
                  </td>
                  <td className={`px-4 py-3 font-mono text-[11px] ${meta.cls}`}>
                    {meta.label}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={r.status}
                      disabled={busyId === r.id}
                      onChange={(e) => setStatus(r.id, e.target.value)}
                      className="eh-term-input py-1.5 text-[12px]"
                    >
                      {Object.keys(STATUS_META).map((s) => (
                        <option key={s} value={s}>
                          {STATUS_META[s].label}
                        </option>
                      ))}
                    </select>
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
