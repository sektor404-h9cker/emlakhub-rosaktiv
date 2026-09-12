"use client";

/**
 * =============================================================================
 * TerminalShell — каркас как на макете: лого · профиль · навигация · язык
 * =============================================================================
 * Навигация = отдельные страницы (не фильтр рынков).
 * =============================================================================
 */

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  GraduationCap,
  MessageSquare,
  BookOpen,
  LogOut,
  Users,
  Wallet,
  Bell,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import EmlakLogo from "./EmlakLogo";

const INVESTOR_HREFS = [
  { href: "/dashboard", key: "navTerminal", icon: LayoutDashboard },
  { href: "/academy", key: "navAcademy", icon: GraduationCap },
  { href: "/support", key: "navChat", icon: MessageSquare },
  { href: "/how-it-works", key: "navHow", icon: BookOpen },
];

const ADMIN_HREFS = [
  { href: "/admin/users", key: "users", icon: Users, labelRu: "Пользователи", labelAz: "İstifadəçilər" },
  { href: "/admin/finance", key: "finance", icon: Wallet, labelRu: "Финансы", labelAz: "Maliyyə" },
  { href: "/admin/support", key: "support", icon: MessageSquare, labelRu: "Поддержка", labelAz: "Dəstək" },
];

export default function TerminalShell({
  children,
  mode = "investor",
  title,
  subtitle,
  onOpenNotifications,
}) {
  const pathname = usePathname();
  const { profile, logout, isAdmin } = useAuth();
  const { locale, setLocale } = useLocale();
  const t = getTerminalDict(locale);

  const nav =
    mode === "admin"
      ? ADMIN_HREFS.map((item) => ({
          ...item,
          label: locale === "az" ? item.labelAz : item.labelRu,
        }))
      : INVESTOR_HREFS.map((item) => ({
          ...item,
          label: t[item.key],
        }));

  const pageTitle = title || (mode === "admin" ? (locale === "az" ? "Admin" : "Админ") : t.title);
  const pageSubtitle =
    subtitle || (mode === "admin" ? "Digital Emlak Hub" : t.subtitle);

  const initial = (profile?.displayName || profile?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="eh-terminal flex min-h-[100dvh] bg-[#05070b] text-[#e8eaed]">
      {/* ---- SIDEBAR ---- */}
      <aside className="flex w-[248px] shrink-0 flex-col border-r border-white/[0.07] bg-[#07090e]">
        <div className="border-b border-white/[0.07] px-4 py-5">
          <Link href="/dashboard" className="block">
            <EmlakLogo />
          </Link>
        </div>

        {/* Профиль */}
        <div className="mx-3 mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/90 text-[14px] font-semibold text-white">
              {initial}
            </div>
            <div className="min-w-0">
              <div className="truncate text-[13px] font-medium text-white">
                {profile?.displayName || profile?.email || "—"}
              </div>
              <div className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-blue-700/90 px-1.5 py-0.5 text-[9px] font-medium text-white">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                {t.proActive}
              </div>
            </div>
          </div>
        </div>

        <nav className="mt-4 flex flex-1 flex-col gap-1 px-3">
          {nav.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] transition",
                  active
                    ? "bg-[#2563eb] text-white shadow-[0_10px_28px_-12px_rgba(37,99,235,0.85)]"
                    : "text-[#94a3b8] hover:bg-white/[0.04] hover:text-white",
                ].join(" ")}
              >
                <Icon size={16} strokeWidth={1.7} />
                {item.label}
              </Link>
            );
          })}

          {isAdmin && mode === "investor" ? (
            <Link
              href="/admin/users"
              className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-[#60a5fa] hover:bg-white/[0.04]"
            >
              <Users size={16} strokeWidth={1.7} />
              {t.navAdmin}
            </Link>
          ) : null}
          {isAdmin && mode === "admin" ? (
            <Link
              href="/dashboard"
              className="mt-2 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-[#60a5fa] hover:bg-white/[0.04]"
            >
              <LayoutDashboard size={16} strokeWidth={1.7} />
              {t.navTerminal}
            </Link>
          ) : null}
        </nav>

        <div className="border-t border-white/[0.07] p-3">
          <button
            type="button"
            onClick={() => logout()}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-[#94a3b8] transition hover:bg-white/[0.04] hover:text-white"
          >
            <LogOut size={15} />
            {t.logout}
          </button>
        </div>
      </aside>

      {/* ---- MAIN ---- */}
      <main className="relative flex min-w-0 flex-1 flex-col">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 12% 0%, rgba(37,99,235,0.10), transparent 42%), radial-gradient(ellipse at 90% 100%, rgba(15,23,42,0.55), transparent 48%)",
          }}
        />

        {/* Header */}
        <header className="relative z-10 flex items-start justify-between gap-4 border-b border-white/[0.06] px-6 py-5 sm:px-8">
          <div>
            <h1 className="text-[26px] font-semibold tracking-tight text-white sm:text-[30px]">
              {pageTitle}
            </h1>
            <p className="mt-1 text-[13px] text-[#64748b]">{pageSubtitle}</p>
          </div>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onOpenNotifications}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#94a3b8] transition hover:text-white"
              aria-label={t.notifications}
            >
              <Bell size={17} />
              <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                9+
              </span>
            </button>

            {/* Язык AZ / RU */}
            <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
              {["az", "ru"].map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocale(code)}
                  className={[
                    "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition",
                    locale === code
                      ? "bg-[#2563eb] text-white"
                      : "text-[#64748b] hover:text-white",
                  ].join(" ")}
                >
                  {code}
                </button>
              ))}
            </div>

            <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 sm:flex">
              <span className="text-[11px] text-[#64748b]">{t.balance}</span>
              <span className="font-mono text-[13px] tabular-nums text-white">~ 999 999</span>
              <TrendingUp size={14} className="text-[#3b82f6]" />
            </div>
          </div>
        </header>

        <div className="relative z-10 flex-1 overflow-auto p-5 sm:p-7 lg:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
