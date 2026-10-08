"use client";

/**
 * AdminSettings - настройки админ-панели + язык AZ/RU/EN
 */

import { Settings2 } from "lucide-react";
import { useSystem } from "@/context/SystemContext";
import { useAuth } from "@/context/AuthContext";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";

export default function AdminSettings() {
  const { adminSettings, updateAdminSettings, pushAudit } = useSystem();
  const { profile } = useAuth();
  const { t, locale, setLocale } = useAdminI18n();
  const s = adminSettings || {};

  const set = (key, value) => {
    updateAdminSettings({ [key]: value });
    pushAudit(profile?.email, `Setting: ${key} = ${value}`);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#93c5fd]">
          Admin · settings
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
          <Settings2 size={22} className="text-[#60a5fa]" />
          {t.settingsTitle}
        </h1>
        <p className="mt-1 text-[13px] text-[#9aa3ad]">{t.settingsHint}</p>
      </header>

      <section className="rounded-2xl border border-sky-400/25 bg-sky-500/[0.06] p-4">
        <div className="text-[13px] font-medium text-white">{t.language}</div>
        <p className="mt-1 text-[12px] text-sky-100/70">{t.langHint}</p>
        <div className="mt-3 flex gap-2">
          {["az", "ru", "en"].map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => {
                setLocale(code);
                set("language", code);
              }}
              className={[
                "rounded-xl px-4 py-2 text-[13px] font-semibold uppercase",
                locale === code
                  ? "bg-[#2563eb] text-white"
                  : "border border-white/10 text-[#9aa3ad]",
              ].join(" ")}
            >
              {code}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
        <Toggle
          label="Email"
          hint="Tickets, fraud, tasks"
          on={!!s.notifyEmail}
          onChange={(v) => set("notifyEmail", v)}
        />
        <Toggle
          label="Push"
          hint="Browser alerts (demo)"
          on={!!s.notifyPush}
          onChange={(v) => set("notifyPush", v)}
        />
        <Toggle
          label="Digest"
          hint="Daily summary"
          on={!!s.digestDaily}
          onChange={(v) => set("digestDaily", v)}
        />
        <Toggle
          label="Compact nav"
          hint="Shorter sidebar"
          on={!!s.compactNav}
          onChange={(v) => set("compactNav", v)}
        />
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
        <label className="block text-[12px] text-[#9aa3ad]">
          Timezone
          <select
            className="eh-term-input mt-1.5"
            value={s.timezone || "Asia/Baku"}
            onChange={(e) => set("timezone", e.target.value)}
          >
            <option value="Asia/Baku">Asia/Baku</option>
            <option value="Europe/Moscow">Europe/Moscow</option>
            <option value="UTC">UTC</option>
          </select>
        </label>
      </section>
    </div>
  );
}

function Toggle({ label, hint, on, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex w-full items-center justify-between gap-3 rounded-xl border border-white/[0.06] px-3 py-3 text-left"
    >
      <div>
        <div className="text-[13px] font-medium text-white">{label}</div>
        <div className="text-[11px] text-[#64748b]">{hint}</div>
      </div>
      <span
        className={[
          "relative h-6 w-11 shrink-0 rounded-full transition",
          on ? "bg-emerald-500/80" : "bg-white/10",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-5 w-5 rounded-full bg-white transition",
            on ? "left-5" : "left-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}
