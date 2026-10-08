"use client";

/**
 * PrivateRoute - сессия + роль + привилегия раздела админки
 */

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useSystem } from "@/context/SystemContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { PRIV, isSoftAdminPath } from "@/lib/adminPrivileges";

function privForPath(pathname) {
  if (!pathname) return null;
  if (isSoftAdminPath(pathname)) return null; // любой staff
  if (pathname.startsWith("/admin/users")) return PRIV.USERS;
  if (pathname.startsWith("/admin/staff")) return PRIV.STAFF;
  if (pathname.startsWith("/admin/finance")) return PRIV.FINANCE;
  if (pathname.startsWith("/admin/support")) return PRIV.SUPPORT;
  if (pathname.startsWith("/admin/system")) return PRIV.SYSTEM;
  if (pathname.startsWith("/admin/security")) return PRIV.SECURITY;
  if (pathname.startsWith("/admin/team")) return PRIV.TEAM;
  if (pathname.startsWith("/admin/tasks")) return PRIV.TASKS;
  if (pathname.startsWith("/admin/settings")) return PRIV.SETTINGS;
  if (pathname.startsWith("/admin/lots")) return PRIV.LOTS;
  if (pathname === "/admin" || pathname === "/admin/") return null; // dashboard for any staff
  return PRIV.USERS;
}

export default function PrivateRoute({
  children,
  requireAdmin = false,
  adminPath = "",
}) {
  const router = useRouter();
  const {
    loading,
    user,
    profile,
    blocked,
    isAdmin,
    canTerminal,
    role,
    sessionError,
    retrySession,
  } = useAuth();
  const { hasPrivilege, adminHomeForRole, isAdminCapable } = useSystem();

  useEffect(() => {
    if (loading || sessionError) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (blocked) return;
    const adminOk = isAdmin || isAdminCapable(role);
    if (requireAdmin && !adminOk) {
      router.replace("/dashboard");
      return;
    }
    if (requireAdmin && adminOk) {
      const need = privForPath(adminPath);
      if (need && !hasPrivilege(role, need)) {
        router.replace(adminHomeForRole(role));
      }
    }
    if (!requireAdmin && !canTerminal) {
      router.replace("/login");
    }
  }, [
    loading,
    sessionError,
    user,
    blocked,
    isAdmin,
    canTerminal,
    requireAdmin,
    adminPath,
    role,
    router,
    hasPrivilege,
    adminHomeForRole,
    isAdminCapable,
  ]);

  if (loading) {
    return (
      <div className="flex min-h-[100dvh] items-center justify-center bg-[#050505] text-[#9aa3ad]">
        <div className="font-mono text-[11px] uppercase tracking-[0.28em]">
          Загрузка терминала…
        </div>
      </div>
    );
  }

  if (sessionError && !user) {
    const text =
      sessionError === "unconfigured"
        ? "База не настроена. Терминал не показывает демо-данные вместо неё."
        : "База временно недоступна. Попробуйте позже.";
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#050505] px-6 text-center">
        <p className="max-w-md text-[15px] leading-relaxed text-white">{text}</p>
        <button
          type="button"
          onClick={retrySession}
          className="mt-4 rounded-xl border border-white/15 px-4 py-2 text-[13px] text-white"
        >
          Повторить
        </button>
      </div>
    );
  }

  if (!user) return null;

  if (user?.isPostgres && profile?.consentCurrent !== true) {
    return <ConsentGate />;
  }

  if (blocked) {
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-[#050505] px-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-amber-500/80">
          Access denied
        </p>
        <h1 className="mt-3 font-serif text-2xl text-white">
          Аккаунт заблокирован
        </h1>
        <p className="mt-2 max-w-sm text-sm text-[#9aa3ad]">
          Обратитесь в поддержку Digital Emlak Hub. Роль: {profile?.role || "-"}.
        </p>
      </div>
    );
  }

  const adminOk = isAdmin || isAdminCapable(role);
  if (requireAdmin && !adminOk) return null;
  if (requireAdmin && adminOk) {
    const need = privForPath(adminPath);
    if (need && !hasPrivilege(role, need)) return null;
  }
  if (!requireAdmin && !canTerminal) return null;

  return children;
}

const CONSENT_COPY = {
  az: {
    title: "Şərtlər yenilənib",
    body: "Davam etmək üçün hazırkı sazişi və məxfilik siyasətini qəbul edin.",
    check: "İstifadəçi sazişini və Məxfilik siyasətini qəbul edirəm.",
    terms: "Saziş",
    privacy: "Məxfilik",
    submit: "Qəbul edirəm",
    need: "Qəbul etmədən terminal açılmır.",
  },
  ru: {
    title: "Условия обновились",
    body: "Чтобы продолжить, примите действующие соглашение и политику конфиденциальности.",
    check: "Я принимаю Пользовательское соглашение и Политику конфиденциальности.",
    terms: "Соглашение",
    privacy: "Конфиденциальность",
    submit: "Принять",
    need: "Без согласия терминал не откроется.",
  },
  en: {
    title: "Terms were updated",
    body: "Accept the current terms and privacy policy to continue.",
    check: "I accept the Terms of use and the Privacy policy.",
    terms: "Terms",
    privacy: "Privacy",
    submit: "Accept",
    need: "The terminal stays closed until you accept.",
  },
};

function ConsentGate() {
  const { locale } = useLocale();
  const { refreshProfile } = useAuth();
  const t = CONSENT_COPY[locale] || CONSENT_COPY.az;
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event) => {
    event.preventDefault();
    if (!checked) {
      setError(t.need);
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/me/consent", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ acceptLegal: true, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || t.need);
      await refreshProfile();
    } catch (err) {
      setError(err.message || t.need);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-[#050505] px-6">
      <form onSubmit={onSubmit} className="w-full max-w-md">
        <h1 className="font-serif text-3xl text-white">{t.title}</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-[#a8a29e]">{t.body}</p>
        <label className="mt-6 flex items-start gap-3 text-[14px] leading-relaxed text-[#e7e5e4]">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1"
          />
          <span>
            {t.check}{" "}
            <Link href="/legal/terms" className="text-[#93c5fd]">
              {t.terms}
            </Link>
            {" · "}
            <Link href="/legal/privacy" className="text-[#93c5fd]">
              {t.privacy}
            </Link>
          </span>
        </label>
        {error ? <p className="mt-3 text-[13px] text-red-300">{error}</p> : null}
        <button
          type="submit"
          disabled={busy}
          className="mt-6 rounded-xl border border-white/15 px-4 py-2 text-[14px] text-white disabled:opacity-40"
        >
          {t.submit}
        </button>
      </form>
    </div>
  );
}
