"use client";

/**
 * AdminProfile - ФИО, аватар, статус, роль, должность
 */

import { useMemo, useState } from "react";
import {
  UserRound,
  Shield,
  Mail,
  Save,
  Sparkles,
  Briefcase,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useSystem } from "@/context/SystemContext";
import { PRIV_LABELS } from "@/lib/adminPrivileges";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";
import { AVATAR_PRESETS } from "@/data/avatars";
import UserAvatar from "@/components/terminal/UserAvatar";
import { ROLES, ADMIN_ROLES } from "@/lib/roles";
import {
  PRESENCE,
  presenceMeta,
  personLabel,
  composeDisplayName,
  splitDisplayName,
  personInitials,
} from "@/lib/staffProfile";
import { DEPARTMENTS, deptLabel } from "@/lib/adminDepartments";

const COPY = {
  az: {
    first: "Ad",
    last: "Soyad",
    title: "Vəzifə",
    dept: "Şöbə",
    role: "Rol",
    presence: "Status",
    avatar: "Avatar",
    save: "Yadda saxla",
    saved: "Saxlanıldı",
    theme: "Kartın rəngi",
    bio: "Qısa bio",
    bioPh: "Məs: fraud və L2 tiket",
    preview: "Təyinatda belə görünəcək",
    links: "Sürətli keçidlər",
    privs: "Sizin bölmələr",
  },
  ru: {
    first: "Имя",
    last: "Фамилия",
    title: "Должность",
    dept: "Отдел",
    role: "Роль",
    presence: "Статус",
    avatar: "Аватар",
    save: "Сохранить",
    saved: "Сохранено",
    theme: "Цвет карточки",
    bio: "Коротко о себе",
    bioPh: "Напр: fraud и эскалации L2",
    preview: "Так вас увидят в назначении",
    links: "Быстрые ссылки",
    privs: "Ваши разделы",
  },
  en: {
    first: "First name",
    last: "Last name",
    title: "Job title",
    dept: "Department",
    role: "Role",
    presence: "Status",
    avatar: "Avatar",
    save: "Save",
    saved: "Saved",
    theme: "Card accent",
    bio: "Short bio",
    bioPh: "e.g. fraud & L2 escalations",
    preview: "How you appear in assignments",
    links: "Quick links",
    privs: "Your sections",
  },
};

const ACCENTS = [
  { id: "sky", from: "#0c4a6e", to: "#1e3a5f" },
  { id: "emerald", from: "#064e3b", to: "#0f172a" },
  { id: "violet", from: "#4c1d95", to: "#1e1b4b" },
  { id: "rose", from: "#881337", to: "#1c1917" },
  { id: "amber", from: "#78350f", to: "#1c1917" },
];

function buildDraft(profile, role) {
  const s = splitDisplayName(profile?.displayName || "");
  return {
    firstName: profile?.firstName || s.firstName || "",
    lastName: profile?.lastName || s.lastName || "",
    jobTitle: profile?.jobTitle || "",
    department: profile?.department || "ops",
    presence: profile?.presence || "online",
    avatarId: profile?.avatarId || "ocean",
    accent: profile?.accent || "sky",
    bio: profile?.bio || "",
    rolePick: profile?.role || role || ROLES.ADMIN,
  };
}

export default function AdminProfile() {
  const { profile, role, isPro, updateLocalProfile } = useAuth();
  const {
    privilegeMatrix,
    roleLabels,
    adminSettings,
    users,
    upsertUser,
    pushAudit,
  } = useSystem();
  const { t, locale } = useAdminI18n();
  const c = COPY[locale] || COPY.ru;

  const base = useMemo(() => buildDraft(profile, role), [profile, role]);
  const [draft, setDraft] = useState(null);
  const [saved, setSaved] = useState(false);
  const form = draft || base;

  const setField = (key, value) => {
    setDraft((prev) => ({ ...(prev || base), [key]: value }));
  };

  const preview = useMemo(
    () => ({
      firstName: form.firstName,
      lastName: form.lastName,
      displayName: composeDisplayName(
        form.firstName,
        form.lastName,
        profile?.displayName || profile?.email
      ),
      email: profile?.email,
      avatarId: form.avatarId,
      presence: form.presence,
      jobTitle: form.jobTitle,
    }),
    [form, profile]
  );

  const privs =
    privilegeMatrix[form.rolePick] || privilegeMatrix[role] || [];
  const accentStyle =
    ACCENTS.find((a) => a.id === form.accent) || ACCENTS[0];
  const presenceDot = presenceMeta(form.presence, locale);

  const onSave = (e) => {
    e.preventDefault();
    const displayName = composeDisplayName(
      form.firstName,
      form.lastName,
      profile?.displayName || profile?.email
    );
    const patch = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      displayName,
      jobTitle: form.jobTitle.trim(),
      department: form.department,
      presence: form.presence,
      avatarId: form.avatarId,
      accent: form.accent,
      bio: form.bio.trim(),
      role: ADMIN_ROLES.includes(form.rolePick)
        ? form.rolePick
        : profile?.role,
    };
    updateLocalProfile(patch);

    const existing = users.find(
      (u) => u.email === profile?.email || u.id === profile?.id
    );
    upsertUser({
      ...(existing || {}),
      id: existing?.id || profile?.id || `u-${profile?.email}`,
      email: profile?.email,
      ...patch,
      blocked: existing?.blocked || false,
      subscription: existing?.subscription || profile?.subscription,
    });

    pushAudit(profile?.email, `Profile updated: ${displayName}`);
    setDraft(null);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-10">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#93c5fd]">
          Admin · profile
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
          <UserRound size={22} className="text-[#60a5fa]" />
          {t.profileTitle}
        </h1>
        <p className="mt-1 text-[13px] text-[#9aa3ad]">{t.profileHint}</p>
      </header>

      <section
        className="rounded-2xl border border-white/10 p-5"
        style={{
          background: `linear-gradient(135deg, ${accentStyle.from} 0%, ${accentStyle.to} 55%, #0a0c12 100%)`,
        }}
      >
        <div className="flex flex-wrap items-start gap-4">
          <UserAvatar
            name={personLabel(preview)}
            avatarId={form.avatarId}
            size="lg"
            status={presenceDot.color}
            initials={personInitials(preview)}
          />
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold text-white">
              {personLabel(preview) || "-"}
            </h2>
            {form.jobTitle ? (
              <p className="mt-0.5 flex items-center gap-1.5 text-[13px] text-white/70">
                <Briefcase size={13} />
                {form.jobTitle}
              </p>
            ) : null}
            <p className="mt-1 flex items-center gap-1.5 text-[13px] text-white/60">
              <Mail size={13} />
              {profile?.email}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1 rounded-lg border border-white/20 bg-black/25 px-2.5 py-1 text-[11px] text-white">
                <Shield size={12} />
                {roleLabels[form.rolePick] || form.rolePick}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-black/25 px-2.5 py-1 text-[11px] text-white/90">
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: presenceDot.color }}
                />
                {presenceDot.label}
              </span>
              <span className="rounded-lg border border-white/15 bg-black/25 px-2.5 py-1 font-mono text-[11px] text-white/80">
                {isPro ? "PRO" : "FREE"}
              </span>
            </div>
          </div>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-[11px] text-white/50">
          <Sparkles size={12} />
          {c.preview}: {personLabel(preview)}
        </p>
      </section>

      <form onSubmit={onSave} className="space-y-4">
        <section className="grid gap-3 rounded-2xl border border-white/10 bg-[#0a0c12] p-4 sm:grid-cols-2">
          <label className="block text-[12px] text-[#9aa3ad]">
            {c.first}
            <input
              className="eh-term-input mt-1.5"
              value={form.firstName}
              onChange={(e) => setField("firstName", e.target.value)}
              placeholder="Jamal"
              required
            />
          </label>
          <label className="block text-[12px] text-[#9aa3ad]">
            {c.last}
            <input
              className="eh-term-input mt-1.5"
              value={form.lastName}
              onChange={(e) => setField("lastName", e.target.value)}
              placeholder="Guseynov"
              required
            />
          </label>
          <label className="block text-[12px] text-[#9aa3ad] sm:col-span-2">
            {c.title}
            <input
              className="eh-term-input mt-1.5"
              value={form.jobTitle}
              onChange={(e) => setField("jobTitle", e.target.value)}
              placeholder="Lead Support / SOC Analyst"
            />
          </label>
          <label className="block text-[12px] text-[#9aa3ad]">
            {c.dept}
            <select
              className="eh-term-input mt-1.5"
              value={form.department}
              onChange={(e) => setField("department", e.target.value)}
            >
              {DEPARTMENTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {deptLabel(d.id, locale)}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] text-[#9aa3ad]">
            {c.role}
            <select
              className="eh-term-input mt-1.5"
              value={form.rolePick}
              onChange={(e) => setField("rolePick", e.target.value)}
            >
              {ADMIN_ROLES.map((r) => (
                <option key={r} value={r}>
                  {roleLabels[r] || r}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] text-[#9aa3ad] sm:col-span-2">
            {c.bio}
            <input
              className="eh-term-input mt-1.5"
              value={form.bio}
              onChange={(e) => setField("bio", e.target.value)}
              placeholder={c.bioPh}
            />
          </label>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
          <div className="text-[13px] font-medium text-white">{c.presence}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESENCE.map((p) => {
              const m = presenceMeta(p.id, locale);
              const on = form.presence === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setField("presence", p.id)}
                  className={[
                    "inline-flex items-center gap-2 rounded-xl px-3 py-2 text-[12px]",
                    on
                      ? "bg-white/12 text-white"
                      : "border border-white/10 text-[#9aa3ad]",
                  ].join(" ")}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: p.color }}
                  />
                  {m.label}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
          <div className="text-[13px] font-medium text-white">{c.avatar}</div>
          <div className="mt-3 flex flex-wrap gap-2.5">
            {AVATAR_PRESETS.map((a) => {
              const on = form.avatarId === a.id;
              return (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => setField("avatarId", a.id)}
                  className={[
                    "rounded-full p-0.5 transition",
                    on ? "ring-2 ring-sky-400" : "opacity-70 hover:opacity-100",
                  ].join(" ")}
                  aria-label={a.id}
                >
                  <UserAvatar
                    name={personLabel(preview)}
                    avatarId={a.id}
                    size="sm"
                    initials={personInitials(preview)}
                  />
                </button>
              );
            })}
          </div>
          <div className="mt-4 text-[13px] font-medium text-white">{c.theme}</div>
          <div className="mt-2 flex flex-wrap gap-2">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setField("accent", a.id)}
                className={[
                  "h-8 w-8 rounded-full border-2",
                  form.accent === a.id ? "border-white" : "border-transparent",
                ].join(" ")}
                style={{
                  background: `linear-gradient(135deg, ${a.from}, ${a.to})`,
                }}
                aria-label={a.id}
              />
            ))}
          </div>
        </section>

        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563eb] px-4 py-2.5 text-[13px] font-semibold text-white"
        >
          <Save size={14} />
          {saved ? c.saved : c.save}
        </button>
      </form>

      <section className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
        <h2 className="text-[14px] font-semibold text-white">{c.privs}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {privs.length ? (
            privs.map((p) => (
              <span
                key={p}
                className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[12px] text-[#e2e8f0]"
              >
                {PRIV_LABELS[p] || p}
              </span>
            ))
          ) : (
            <span className="text-[12px] text-[#64748b]">-</span>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
        <h2 className="text-[14px] font-semibold text-white">{c.links}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href="/admin/settings"
            className="rounded-xl border border-white/10 px-3 py-2 text-[12px] text-[#93c5fd]"
          >
            {t.settingsTitle}
          </Link>
          <Link
            href="/admin/activity"
            className="rounded-xl border border-white/10 px-3 py-2 text-[12px] text-[#93c5fd]"
          >
            {t.activityTitle}
          </Link>
          <Link
            href="/admin/team"
            className="rounded-xl border border-white/10 px-3 py-2 text-[12px] text-[#93c5fd]"
          >
            {t.teamTitle}
          </Link>
          <Link
            href="/admin/tasks"
            className="rounded-xl border border-white/10 px-3 py-2 text-[12px] text-[#93c5fd]"
          >
            {t.tasksTitle}
          </Link>
        </div>
        <p className="mt-3 text-[11px] text-[#64748b]">
          {adminSettings?.timezone || "Asia/Baku"} ·{" "}
          {adminSettings?.language || locale}
        </p>
      </section>
    </div>
  );
}
