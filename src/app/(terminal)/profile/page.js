"use client";

/**
 * =============================================================================
 * ProfilePage - настройки пользователя + аватар + перезапуск гида
 * =============================================================================
 */

import { useState } from "react";
import { User, Building2, Compass, Shield } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTerminalPanel } from "@/context/TerminalPanelContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";
import { usePaymentsJournal } from "@/hooks/usePaymentsJournal";
import {
  formatExpiry,
  daysLeft,
  isProActive,
  subscriptionWindow,
} from "@/lib/subscription";
import { AVATAR_PRESETS } from "@/data/avatars";
import UserAvatar from "@/components/terminal/UserAvatar";
import PartnersPanel from "@/components/terminal/PartnersPanel";

export default function ProfilePage() {
  const { locale, setLocale } = useLocale();
  const t = getTerminalDict(locale);
  const { profile, updateLocalProfile } = useAuth();
  const { prefs, savePrefs, startTour, setShowGuides } = useTerminalPanel();

  const profileName = profile?.displayName || "";
  const prefsKey = JSON.stringify({
    company: prefs.company || "",
    focus: prefs.focus || "both",
    risk: prefs.risk || "balanced",
    avatarId: prefs.avatarId || "ocean",
    notifyEmail: prefs.notifyEmail !== false,
    notifyPush: prefs.notifyPush !== false,
  });
  const [name, setName] = useState(profileName);
  const [nameFrom, setNameFrom] = useState(profileName);
  const [company, setCompany] = useState(prefs.company || "");
  const [focus, setFocus] = useState(prefs.focus || "both");
  const [risk, setRisk] = useState(prefs.risk || "balanced");
  const [avatarId, setAvatarId] = useState(prefs.avatarId || "ocean");
  const [notifyEmail, setNotifyEmail] = useState(prefs.notifyEmail !== false);
  const [notifyPush, setNotifyPush] = useState(prefs.notifyPush !== false);
  const [prefsFrom, setPrefsFrom] = useState(prefsKey);
  const [saved, setSaved] = useState(false);

  if (profileName !== nameFrom) {
    setNameFrom(profileName);
    setName(profileName);
  }
  if (prefsKey !== prefsFrom) {
    const next = JSON.parse(prefsKey);
    setPrefsFrom(prefsKey);
    setCompany(next.company);
    setFocus(next.focus);
    setRisk(next.risk);
    setAvatarId(next.avatarId);
    setNotifyEmail(next.notifyEmail);
    setNotifyPush(next.notifyPush);
  }

  const onSave = (e) => {
    e.preventDefault();
    updateLocalProfile({ displayName: name.trim() || profile?.displayName });
    savePrefs({
      company: company.trim(),
      focus,
      risk,
      avatarId,
      notifyEmail,
      notifyPush,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };

  const previewName = name.trim() || profile?.displayName || "?";

  return (
    <div className="mx-auto max-w-[640px]">
      <div className="flex items-center gap-4 border-b border-white/[0.06] pb-6">
        <UserAvatar name={previewName} avatarId={avatarId} size="lg" />
        <div>
          <div className="text-[22px] font-semibold tracking-tight text-white">{previewName}</div>
          <div className="mt-1 text-[13px] text-[#a8a29e]">
            {company.trim() || t.profileNoCompany}
          </div>
          <div className="mt-1 text-[12px] text-[#d6d3d1]">
            {isProActive(profile?.subscription) ? "PRO" : "Free"}
          </div>
        </div>
      </div>

      <form onSubmit={onSave} className="mt-8 space-y-8">
        <section>
          <h2 className="text-[15px] font-medium text-white">
            {locale === "az" ? "İnvestisiya profili" : "Инвестиционный профиль"}
          </h2>
          <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-[#a8a29e]">
            {locale === "az"
              ? "Bu, yalnız analitikanın təqdimatına və sizin ssenarilərinizə təsir edir. Bazarın ilkin məlumatı dəyişmir."
              : "Это влияет только на представление аналитики и ваши сценарии. Исходные данные рынка не меняются."}
          </p>
        </section>

        <Field icon={User} label={t.profileName}>
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
            {profile?.email || "-"}
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
            {["az", "ru", "en"].map((code) => (
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

        <SubscriptionStatusCard profile={profile} locale={locale} />
        <PartnersPanel />
        <BillingHistory email={profile?.email} />

        <details className="border-t border-white/[0.06] pt-4">
          <summary className="cursor-pointer text-[13px] text-[#a8a29e]">{t.profileAvatar}</summary>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {AVATAR_PRESETS.map((a) => {
              const on = avatarId === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setAvatarId(a.id)}
                  className={[
                    "rounded-full p-0.5 transition",
                    on ? "ring-2 ring-white/70" : "ring-1 ring-white/10 hover:ring-white/30",
                  ].join(" ")}
                  aria-label={a.id}
                >
                  <span
                    className="block h-8 w-8 rounded-full"
                    style={{ background: `linear-gradient(145deg, ${a.from}, ${a.to})` }}
                  />
                </button>
              );
            })}
          </div>
        </details>

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

function SubscriptionStatusCard({ profile, locale }) {
  const { openPaywall } = useAuth();
  const win = subscriptionWindow(profile?.subscription);
  const pro = isProActive(profile?.subscription);
  const left = daysLeft(profile?.subscription);
  const az = locale === "az";

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
        {az ? "Abunəlik" : "Подписка"}
      </div>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-2">
        <div>
          <div
            className={[
              "font-mono text-[18px] font-semibold",
              pro ? "text-emerald-300" : "text-amber-300",
            ].join(" ")}
          >
            {pro ? "PRO" : "FREE"}
            {pro && left != null ? ` · ${left} ${az ? "gün" : "дн."}` : ""}
          </div>
          <p className="mt-1 font-mono text-[12px] text-[#94a3b8]">
            {win.startsAt || win.expiresAt
              ? `${formatExpiry(win.startsAt, az ? "az" : "ru")} → ${formatExpiry(win.expiresAt, az ? "az" : "ru")}`
              : az
                ? "Aktiv pəncərə yoxdur"
                : "Нет активного периода"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => openPaywall("renew")}
          className="rounded-xl bg-white px-3 py-2 text-[12px] font-semibold text-slate-950"
        >
          {az ? "PRO-nu uzat" : locale === "en" ? "Renew PRO" : "Продлить PRO"}
        </button>
      </div>
    </div>
  );
}

function BillingHistory({ email }) {
  const { t, locale } = useAdminI18n();
  const { rows, loading, error } = usePaymentsJournal();
  const mine = rows.filter(
    (p) => p.userEmail === email || !email
  );
  const loc = locale === "az" ? "az-AZ" : "ru-RU";
  const fmt = (ts) =>
    ts
      ? new Date(ts).toLocaleDateString(loc, {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "—";

  const statusLabel = (s) => {
    const map = {
      paid: locale === "az" ? "ödənilib" : "оплачено",
      pending: locale === "az" ? "gözləyir" : "ожидание",
      failed: locale === "az" ? "uğursuz" : "ошибка",
      refunded: locale === "az" ? "qaytarılıb" : "возврат",
      cancelled: locale === "az" ? "ləğv" : "отмена",
    };
    return map[s] || s;
  };

  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
        {t.billingTitle}
      </div>
      <p className="mt-1 text-[12px] text-[#94a3b8]">{t.billingHint}</p>
      {loading ? (
        <p className="mt-3 text-[12px] text-[#64748b]">…</p>
      ) : error ? (
        <p className="mt-3 text-[12px] text-amber-200">{error}</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {mine.map((p) => (
            <li
              key={p.id}
              className="rounded-xl border border-white/[0.06] px-3 py-2.5 text-[12px]"
            >
              <div className="flex justify-between gap-2">
                <span className="text-white">
                  {p.planId || p.plan} · {statusLabel(p.status)}
                </span>
                <span className="font-mono text-[#9aa3ad]">₼ {p.amount}</span>
              </div>
              {p.status === "paid" && (p.activeFrom || p.activeTo) ? (
                <p className="mt-1 text-[11px] text-[#64748b]">
                  {locale === "az" ? "Aktiv:" : "Активен:"}{" "}
                  {fmt(p.activeFrom)} → {fmt(p.activeTo)}
                </p>
              ) : p.status === "pending" ? (
                <p className="mt-1 text-[11px] text-amber-400/90">
                  {locale === "az"
                    ? "Ödəniş təsdiqi gözlənilir"
                    : "Ожидает подтверждения оплаты"}
                </p>
              ) : null}
            </li>
          ))}
          {!mine.length ? (
            <li className="text-[12px] text-[#64748b]">{t.billingEmpty}</li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
