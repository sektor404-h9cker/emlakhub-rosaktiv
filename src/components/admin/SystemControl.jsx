"use client";

/**
 * SystemControl — kill-switch и шаблоны статусов
 */

import { SYSTEM_TEMPLATES, useSystem } from "@/context/SystemContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function SystemControl() {
  const { system, applyTemplate, setCustomStatus, isLocked } = useSystem();
  const { locale } = useLocale();
  const ru = locale !== "az";

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#93c5fd]">
          Admin · system
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-white">
          {ru ? "Состояние системы" : "Sistem statusu"}
        </h1>
        <p className="mt-1 text-[13px] text-[#9aa3ad]">
          {ru
            ? "Одним кликом отключить терминал для всех пользователей. Админы сохраняют доступ."
            : "Bir kliklə terminalı hər kəs üçün söndürün. Adminlər daxil ola bilər."}
        </p>
      </header>

      <div
        className={[
          "rounded-2xl border p-4",
          isLocked
            ? "border-rose-500/40 bg-rose-500/[0.08]"
            : "border-emerald-500/30 bg-emerald-500/[0.07]",
        ].join(" ")}
      >
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#94a3b8]">
          {ru ? "Сейчас" : "İndi"}
        </div>
        <div className="mt-1 text-[18px] font-semibold text-white">
          {ru ? system.titleRu || "Всё работает" : system.titleAz || "Hamısı işləyir"}
        </div>
        <p className="mt-1 text-[13px] text-[#94a3b8]">
          {(ru ? system.messageRu : system.messageAz) || "—"}
        </p>
        <div className="mt-2 font-mono text-[10px] text-[#64748b]">
          status: {system.status} · {new Date(system.updatedAt).toLocaleString()}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {SYSTEM_TEMPLATES.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => applyTemplate(t.id)}
            className={[
              "rounded-2xl border p-4 text-left transition",
              system.templateId === t.id
                ? "border-[#2563eb]/50 bg-[#2563eb]/15"
                : "border-white/10 bg-[#0a0c12] hover:border-white/20",
            ].join(" ")}
          >
            <div className="text-[14px] font-semibold text-white">
              {ru ? t.titleRu : t.titleAz}
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-[#94a3b8]">
              {(ru ? t.messageRu : t.messageAz) ||
                (ru ? "Снять блокировку" : "Blokdan çıxar")}
            </p>
            <div className="mt-2 font-mono text-[10px] uppercase text-[#64748b]">
              {t.status}
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
        <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
          {ru ? "Своё сообщение" : "Öz mesajınız"}
        </div>
        <textarea
          className="eh-term-input mt-2 min-h-[88px]"
          value={ru ? system.messageRu : system.messageAz}
          onChange={(e) =>
            setCustomStatus(
              ru
                ? { messageRu: e.target.value }
                : { messageAz: e.target.value }
            )
          }
        />
      </div>
    </div>
  );
}
