"use client";

/**
 * =============================================================================
 * ProfilePage — настройки пользователя + перезапуск гида
 * =============================================================================
 */

import { useEffect, useState } from "react";
import { User, Building2, Compass, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTerminalPanel } from "@/context/TerminalPanelContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import SectionGuide from "@/components/terminal/SectionGuide";

export default function ProfilePage() {
  const { locale, setLocale } = useLocale();
  const t = getTerminalDict(locale);
  const { profile, updateLocalProfile } = useAuth();
  const { prefs, savePrefs, startTour, setShowGuides } = useTerminalPanel();

  const [name, setName] = useState(profile?.displayName || "");
  const [company, setCompany] = useState(prefs.company || "");
  const [focus, setFocus] = useState(prefs.focus || "both");
  const [risk, setRisk] = useState(prefs.risk || "balanced");
  const [notifyEmail, setNotifyEmail] = useState(prefs.notifyEmail !== false);
  const [notifyPush, setNotifyPush] = useState(prefs.notifyPush !== false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setName(profile?.displayName || "");
  }, [profile?.displayName]);

  useEffect(() => {
    setCompany(prefs.company || "");
    setFocus(prefs.focus || "both");
    setRisk(prefs.risk || "balanced");
    setNotifyEmail(prefs.notifyEmail !== false);
    setNotifyPush(prefs.notifyPush !== false);
  }, [prefs]);

  const onSave = (e) => {
    e.preventDefault();
    updateLocalProfile({ displayName: name.trim() || profile?.displayName });
    savePrefs({ company: company.trim(), focus, risk, notifyEmail, notifyPush });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  return (
    <div className="mx-auto max-w-[640px]">
      <SectionGuide section="profile" />

      <h2 className="text-[20px] font-semibold text-white">{t.profileTitle}</h2>
      <p className="mt-1 text-[13px] text-[#64748b]">{t.profileHint}</p>

      <form onSubmit={onSave} className="mt-6 space-y-5">
        <Field
          icon={User}
          label={t.profileName}
        >
          <input
            className="eh-term-input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t.profileNamePh}
          />
        </Field>

        <Field icon={Building2} label={t.profileCompany}>
          <input
            className="eh-term-input"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
            placeholder={t.profileCompanyPh}
          />
        </Field>

        <div className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
            {t.profileEmail}
          </div>
          <div className="mt-2 font-mono text-[13px] text-[#94a3b8]">
            {profile?.email || "—"}
          </div>
        </div>

        <Field icon={Compass} label={t.profileFocus}>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "both", label: t.focusBoth },
              { id: "auto", label: t.focusAuto },
              { id: "estate", label: t.focusEstate },
            ].map((opt) => (
              <Chip
                key={opt.id}
                active={focus === opt.id}
                onClick={() => setFocus(opt.id)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
        </Field>

        <Field icon={Shield} label={t.profileRisk}>
          <div className="flex flex-wrap gap-2">
            {[
              { id: "cautious", label: t.riskCautious },
              { id: "balanced", label: t.riskBalanced },
              { id: "aggressive", label: t.riskAggressive },
            ].map((opt) => (
              <Chip
                key={opt.id}
                active={risk === opt.id}
                onClick={() => setRisk(opt.id)}
              >
                {opt.label}
              </Chip>
            ))}
          </div>
          <p className="mt-2 text-[12px] text-[#64748b]">{t.profileRiskHint}</p>
        </Field>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
            {t.profileLang}
          </div>
          <div className="flex gap-2">
            {["az", "ru"].map((code) => (
              <Chip
                key={code}
                active={locale === code}
                onClick={() => setLocale(code)}
              >
                {code.toUpperCase()}
              </Chip>
            ))}
          </div>
        </div>

        <div className="space-y-2 rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
            {t.profileNotify}
          </div>
          <Toggle
            label={t.profileNotifyEmail}
            checked={notifyEmail}
            onChange={setNotifyEmail}
          />
          <Toggle
            label={t.profileNotifyPush}
            checked={notifyPush}
            onChange={setNotifyPush}
          />
          <Toggle
            label={t.profileShowGuides}
            checked={prefs.showGuides !== false}
            onChange={(v) => {
              setShowGuides(v);
            }}
          />
          <p className="text-[12px] text-[#64748b]">{t.profileShowGuidesHint}</p>
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
          <button
            type="submit"
            className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-[13px] font-semibold text-white hover:bg-[#1d4ed8]"
          >
            {t.profileSave}
          </button>
          <button
            type="button"
            onClick={startTour}
            className="rounded-xl border border-white/10 px-5 py-2.5 text-[13px] font-medium text-[#94a3b8] hover:text-white"
          >
            {t.tourRestart}
          </button>
          {saved ? (
            <span className="self-center text-[12px] text-emerald-400">
              {t.profileSaved}
            </span>
          ) : null}
        </div>
      </form>
    </div>
  );
}

function Field({ icon: Icon, label, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
        <Icon size={12} />
        {label}
      </span>
      {children}
    </label>
  );
}

function Chip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl border px-3 py-2 text-[12px] font-medium transition",
        active
          ? "border-[#2563eb]/50 bg-[#2563eb]/20 text-white"
          : "border-white/10 text-[#94a3b8] hover:text-white",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function Toggle({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between rounded-xl px-1 py-1.5 text-left text-[13px] text-[#cbd5e1]"
    >
      <span>{label}</span>
      <span
        className={[
          "relative h-5 w-9 rounded-full transition",
          checked ? "bg-[#2563eb]" : "bg-white/10",
        ].join(" ")}
      >
        <span
          className={[
            "absolute top-0.5 h-4 w-4 rounded-full bg-white transition",
            checked ? "left-4" : "left-0.5",
          ].join(" ")}
        />
      </span>
    </button>
  );
}
