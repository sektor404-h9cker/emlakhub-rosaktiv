"use client";

/**
 * =============================================================================
 * TerminalShell - fixed sidebar (не скроллится с контентом) + mobile drawer
 * =============================================================================
 */

import { useEffect, useState } from "react";
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
  Star,
  GitCompare,
  Briefcase,
  Map,
  FileText,
  BellRing,
  Compass,
  UserRound,
  Menu,
  X,
  Shield,
  Server,
  Crown,
  MessagesSquare,
  CheckSquare,
  Settings2,
  ScrollText,
  Activity,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTerminalPanel } from "@/context/TerminalPanelContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import { SECTION_GUIDE } from "@/data/guideCopy";
import { PRIV } from "@/lib/adminPrivileges";
import { adminNavLabel } from "@/lib/i18n/adminDict";
import { useSystem } from "@/context/SystemContext";
import { daysLeft as daysLeftFn } from "@/lib/subscription";
import EmlakLogo from "./EmlakLogo";
import UserAvatar from "./UserAvatar";
import AdminNotifPanel from "@/components/admin/AdminNotifPanel";

const INVESTOR_GROUPS = [
  {
    key: "navGroupMarket",
    items: [
      { href: "/dashboard", key: "navTerminal", icon: LayoutDashboard, guide: "dashboard" },
      { href: "/map", key: "navMap", icon: Map, guide: "map" },
      { href: "/watchlist", key: "navWatchlist", icon: Star, guide: "watchlist" },
      { href: "/compare", key: "navCompare", icon: GitCompare, guide: "compare" },
    ],
  },
  {
    key: "navGroupDeals",
    items: [
      { href: "/portfolio", key: "navPortfolio", icon: Briefcase, guide: "portfolio" },
      { href: "/documents", key: "navDocuments", icon: FileText, guide: "documents" },
      { href: "/alerts", key: "navAlerts", icon: BellRing, guide: "alerts" },
    ],
  },
  {
    key: "navGroupLearn",
    items: [
      { href: "/academy", key: "navAcademy", icon: GraduationCap, guide: "academy" },
      { href: "/support", key: "navChat", icon: MessageSquare, guide: "support" },
      { href: "/how-it-works", key: "navHow", icon: BookOpen, guide: "how" },
      { href: "/profile", key: "navProfile", icon: UserRound, guide: "profile" },
    ],
  },
];

const ADMIN_HREFS = [
  {
    href: "/admin/users",
    priv: PRIV.USERS,
    icon: Users,
    labelRu: "Клиенты",
    labelAz: "Müştərilər",
    labelEn: "Clients",
  },
  {
    href: "/admin/staff",
    priv: PRIV.STAFF,
    icon: UserRound,
    labelRu: "Сотрудники",
    labelAz: "Əməkdaşlar",
    labelEn: "Staff",
  },
  {
    href: "/admin/lots",
    priv: PRIV.LOTS,
    icon: Map,
    labelRu: "Лоты",
    labelAz: "Lotlar",
    labelEn: "Lots",
  },
  {
    href: "/admin/herrac",
    priv: PRIV.LOTS,
    icon: Activity,
    labelRu: "Hərrac Monitor",
    labelAz: "Hərrac Monitor",
    labelEn: "Hərrac Monitor",
  },
  {
    href: "/admin/finance",
    priv: PRIV.FINANCE,
    icon: Wallet,
    labelRu: "Финансы",
    labelAz: "Maliyyə",
    labelEn: "Finance",
  },
  {
    href: "/admin/growth",
    priv: PRIV.FINANCE,
    icon: TrendingUp,
    labelRu: "Бизнес и рост",
    labelAz: "Biznes və artım",
    labelEn: "Business and growth",
  },
  {
    href: "/admin/support",
    priv: PRIV.SUPPORT,
    icon: MessageSquare,
    labelRu: "Поддержка",
    labelAz: "Dəstək",
    labelEn: "Support",
  },
  {
    href: "/admin/team",
    priv: PRIV.TEAM,
    icon: MessagesSquare,
    labelRu: "Чат команды",
    labelAz: "Komanda çatı",
    labelEn: "Team chat",
  },
  {
    href: "/admin/tasks",
    priv: PRIV.TASKS,
    icon: CheckSquare,
    labelRu: "Задачи",
    labelAz: "Tapşırıqlar",
    labelEn: "Tasks",
  },
  {
    href: "/admin/system",
    priv: PRIV.SYSTEM,
    icon: Server,
    labelRu: "Система",
    labelAz: "Sistem",
    labelEn: "System",
  },
  {
    href: "/admin/security",
    priv: PRIV.SECURITY,
    icon: Shield,
    labelRu: "Безопасность",
    labelAz: "Təhlükəsizlik",
    labelEn: "Security",
  },
  {
    href: "/admin/settings",
    priv: PRIV.SETTINGS,
    icon: Settings2,
    labelRu: "Настройки",
    labelAz: "Ayarlar",
    labelEn: "Settings",
  },
];

const ADMIN_SOFT_LINKS = [
  {
    href: "/admin",
    icon: LayoutDashboard,
    labelRu: "Панель",
    labelAz: "Panel",
    labelEn: "Dashboard",
    exact: true,
  },
  {
    href: "/admin/profile",
    icon: UserRound,
    labelRu: "Профиль",
    labelAz: "Profil",
    labelEn: "Profile",
  },
  {
    href: "/admin/activity",
    icon: ScrollText,
    labelRu: "Журнал",
    labelAz: "Jurnal",
    labelEn: "Activity",
  },
];

const PAGE_META = {
  "/dashboard": { titleKey: "navTerminal", subKey: "subtitle" },
  "/map": { titleKey: "mapTitle", subKey: "mapHint" },
  "/watchlist": { titleKey: "watchTitle", subKey: "watchHint" },
  "/compare": { titleKey: "compareTitle", subKey: "compareHint" },
  "/portfolio": { titleKey: "portfolioTitle", subKey: "portfolioHint" },
  "/documents": { titleKey: "docsTitle", subKey: "docsHint" },
  "/alerts": { titleKey: "alertsTitle", subKey: "alertsHint" },
  "/academy": { titleKey: "academyTitle", subKey: "academyHint" },
  "/support": { titleKey: "supportTitle", subKey: "supportHint" },
  "/how-it-works": { titleKey: "howTitle", subKey: "howHint" },
  "/profile": { titleKey: "profileTitle", subKey: "profileHint" },
};

export default function TerminalShell({
  children,
  mode = "investor",
  title,
  subtitle,
  onOpenNotifications,
}) {
  const pathname = usePathname();
  const { profile, logout, isAdmin, isPro, openPaywall, role } = useAuth();
  const { hasPrivilege, adminHomeForRole, isAdminCapable, adminNotifications } =
    useSystem();
  const { balance, unreadCount, watchlist, compare, startTour, prefs } =
    useTerminalPanel();
  const { locale, setLocale } = useLocale();
  const t = getTerminalDict(locale);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const [adminNotifOpen, setAdminNotifOpen] = useState(false);

  if (pathname !== menuPath) {
    setMenuPath(pathname);
    setMenuOpen(false);
  }

  const adminUnread = (adminNotifications || []).filter((n) => !n.read).length;

  useEffect(() => {
    if (!menuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  const meta = PAGE_META[pathname];
  const pageTitle =
    title ||
    (mode === "admin"
      ? locale === "az"
        ? "Admin"
        : locale === "en"
          ? "Admin"
          : "Админ"
      : meta
        ? t[meta.titleKey]
        : t.title);
  const pageSubtitle =
    subtitle ||
    (mode === "admin"
      ? "Digital Emlak Hub"
      : meta
        ? t[meta.subKey]
        : t.subtitle);

  const personName =
    profile?.displayName || profile?.email?.split("@")[0] || "-";
  const companyName = (prefs?.company || "").trim();
  const avatarId = prefs?.avatarId || "ocean";
  const badge =
    mode === "admin"
      ? adminUnread > 9
        ? "9+"
        : adminUnread > 0
          ? String(adminUnread)
          : null
      : unreadCount > 9
        ? "9+"
        : unreadCount > 0
          ? String(unreadCount)
          : null;
  const adminLinks = ADMIN_HREFS.filter((item) => hasPrivilege(role, item.priv));
  const adminCapable = isAdmin || isAdminCapable(role);

  const sidebar = (
    <SidebarBody
      mode={mode}
      pathname={pathname}
      t={t}
      locale={locale}
      isAdmin={adminCapable}
      isPro={isPro}
      adminLinks={adminLinks}
      adminHome={adminHomeForRole(role)}
      personName={personName}
      companyName={companyName}
      avatarId={avatarId}
      subscription={profile?.subscription}
      openPaywall={openPaywall}
      watchlist={watchlist}
      compare={compare}
      logout={logout}
      onNavigate={() => setMenuOpen(false)}
    />
  );

  return (
    <div className="eh-terminal flex h-[100dvh] overflow-hidden bg-[#05070b] text-[#e8eaed]">
      {/* Desktop sidebar - fixed, never scrolls with main content */}
      <aside className="relative z-30 hidden h-full w-[248px] shrink-0 flex-col border-r border-white/[0.07] bg-[#07090e] lg:flex">
        {sidebar}
      </aside>

      {/* Mobile drawer */}
      {menuOpen ? (
        <div className="fixed inset-0 z-[60] lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/65 backdrop-blur-sm"
            aria-label={t.menuClose}
            onClick={() => setMenuOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex h-full w-[min(288px,86vw)] flex-col border-r border-white/[0.07] bg-[#07090e] shadow-2xl">
            <div className="flex items-center justify-end border-b border-white/[0.07] px-3 py-2">
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#94a3b8] hover:bg-white/[0.05] hover:text-white"
                aria-label={t.menuClose}
              >
                <X size={18} />
              </button>
            </div>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <main className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.03), transparent 36%)",
          }}
        />

        <header className="relative z-10 shrink-0 border-b border-white/[0.06] bg-[#05070b]/80 px-4 py-3 backdrop-blur-md sm:px-6 sm:py-4 lg:px-8">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-2.5">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#94a3b8] lg:hidden"
                aria-label={t.menuOpen}
              >
                <Menu size={18} />
              </button>
              <div className="min-w-0">
                <h1 className="truncate text-[20px] font-semibold tracking-tight text-white sm:text-[26px] lg:text-[30px]">
                  {pageTitle}
                </h1>
                <p className="mt-0.5 line-clamp-2 max-w-xl text-[12px] text-[#64748b] sm:text-[13px]">
                  {pageSubtitle}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
              {mode === "investor" ? (
                <button
                  type="button"
                  onClick={startTour}
                  className="eh-press hidden items-center gap-1.5 rounded-lg px-2.5 py-2 text-[12px] text-[#a8a29e] transition hover:bg-white/[0.04] hover:text-white md:inline-flex"
                >
                  <Compass size={14} />
                  {t.tourRestart}
                </button>
              ) : null}

              <div className="relative">
                <button
                  type="button"
                  onClick={() => {
                    if (mode === "admin") setAdminNotifOpen((v) => !v);
                    else onOpenNotifications?.();
                  }}
                  className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-[#94a3b8] transition hover:text-white"
                  aria-label={t.notifications}
                >
                  <Bell size={17} />
                  {badge ? (
                    <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                      {badge}
                    </span>
                  ) : null}
                </button>
                {mode === "admin" ? (
                  <AdminNotifPanel
                    open={adminNotifOpen}
                    onClose={() => setAdminNotifOpen(false)}
                  />
                ) : null}
              </div>

              <div className="flex rounded-xl border border-white/10 bg-white/[0.03] p-1">
                {["az", "ru", "en"].map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLocale(code)}
                    className={[
                      "rounded-lg px-2 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition sm:px-2.5",
                      locale === code
                        ? "bg-white text-[#0b0d12]"
                        : "text-[#78716c] hover:text-white",
                    ].join(" ")}
                  >
                    {code}
                  </button>
                ))}
              </div>

              <div className="hidden items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 xl:flex" title={t.balanceHint}>
                <span className="text-[11px] text-[#64748b]">{t.balance}</span>
                <span className="font-mono text-[13px] tabular-nums text-white">
                  ₼ {balance.toLocaleString("en-US")}
                </span>
                <TrendingUp size={14} className="text-[#3b82f6]" />
              </div>
            </div>
          </div>
        </header>

        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain p-4 sm:p-6 lg:px-8 lg:py-7">
          {children}
        </div>
      </main>
    </div>
  );
}

function SidebarBody({
  mode,
  pathname,
  t,
  locale,
  isAdmin,
  isPro,
  adminLinks,
  adminHome,
  personName,
  companyName,
  avatarId,
  subscription,
  openPaywall,
  watchlist,
  compare,
  logout,
  onNavigate,
}) {
  const left = daysLeftFn(subscription);
  return (
    <>
      <div className="shrink-0 border-b border-white/[0.07] px-4 py-4">
        <Link href="/dashboard" className="block" onClick={onNavigate}>
          <EmlakLogo />
        </Link>
      </div>

      <Link
        href={mode === "admin" ? "/admin/profile" : "/profile"}
        onClick={onNavigate}
        className="mx-3 mt-2 block shrink-0 rounded-xl px-2.5 py-2 transition hover:bg-white/[0.04]"
        title={t.navProfile}
      >
        <div className="flex items-center gap-3">
          <UserAvatar name={personName} avatarId={avatarId} size="md" />
          <div className="min-w-0 flex-1">
            <div className="truncate text-[13px] font-semibold tracking-tight text-white">
              {personName}
            </div>
            {companyName ? (
              <div className="mt-0.5 truncate text-[11px] text-[#94a3b8]">
                {companyName}
              </div>
            ) : (
              <div className="mt-0.5 truncate text-[11px] text-[#475569]">
                {t.profileNoCompany}
              </div>
            )}
            {isPro ? (
              <div className="mt-1 text-[10px] tracking-wide text-[#a8a29e]">
                PRO
                {left != null ? ` · ${left}д` : ""}
              </div>
            ) : (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  openPaywall?.("feature");
                }}
                className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-200"
              >
                <Crown size={9} />
                Free · PRO
              </button>
            )}
          </div>
        </div>
      </Link>

      <nav className="mt-3 min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 pb-2">
        {mode === "admin" ? (
          <div className="flex flex-col gap-1">
            {(adminLinks || []).map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              const label = adminNavLabel(item, locale);
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  active={active}
                  icon={Icon}
                  onClick={onNavigate}
                >
                  {label}
                </NavLink>
              );
            })}
            <div className="my-2 h-px bg-white/[0.06]" />
            {ADMIN_SOFT_LINKS.map((item) => {
              const active = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(item.href + "/");
              const Icon = item.icon;
              const label = adminNavLabel(item, locale);
              return (
                <NavLink
                  key={item.href}
                  href={item.href}
                  active={active}
                  icon={Icon}
                  onClick={onNavigate}
                >
                  {label}
                </NavLink>
              );
            })}
          </div>
        ) : (
          INVESTOR_GROUPS.map((group) => (
            <div key={group.key}>
              <div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#475569]">
                {t[group.key]}
              </div>
              <div className="flex flex-col gap-0.5">
                {group.items.map((item) => {
                  const active =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/");
                  const Icon = item.icon;
                  let count = null;
                  if (item.href === "/watchlist" && watchlist.length) {
                    count = watchlist.length;
                  }
                  if (item.href === "/compare" && compare.length) {
                    count = compare.length;
                  }
                  const g = SECTION_GUIDE[item.guide];
                  const tip = g
                    ? locale === "az"
                      ? g.whyAz
                      : g.whyRu
                    : undefined;
                  return (
                    <NavLink
                      key={item.href}
                      href={item.href}
                      active={active}
                      icon={Icon}
                      count={count}
                      title={tip}
                      onClick={onNavigate}
                    >
                      {t[item.key]}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))
        )}

        {isAdmin && mode === "investor" ? (
          <Link
            href={adminHome || "/admin/users"}
            onClick={onNavigate}
            className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-[#60a5fa] hover:bg-white/[0.04]"
          >
            <Users size={16} strokeWidth={1.7} />
            {t.navAdmin}
          </Link>
        ) : null}
        {isAdmin && mode === "admin" ? (
          <Link
            href="/dashboard"
            onClick={onNavigate}
            className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] text-[#60a5fa] hover:bg-white/[0.04]"
          >
            <LayoutDashboard size={16} strokeWidth={1.7} />
            {t.navTerminal}
          </Link>
        ) : null}
      </nav>

      <div className="shrink-0 border-t border-white/[0.07] p-3">
        <button
          type="button"
          onClick={() => logout()}
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-[13px] text-[#94a3b8] transition hover:bg-white/[0.04] hover:text-white"
        >
          <LogOut size={15} />
          {t.logout}
        </button>
      </div>
    </>
  );
}

function NavLink({ href, active, icon: Icon, children, count, title, onClick }) {
  return (
    <Link
      href={href}
      title={title}
      onClick={onClick}
      className={[
        "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] transition duration-150",
        active
          ? "bg-white/[0.06] text-white"
          : "text-[#a8a29e] hover:bg-white/[0.04] hover:text-white",
      ].join(" ")}
    >
      {active ? (
        <span className="absolute bottom-1.5 left-0 top-1.5 w-[2px] rounded-full bg-[#93c5fd]" />
      ) : null}
      <Icon size={16} strokeWidth={1.6} className="shrink-0" />
      <span className="min-w-0 flex-1 truncate">{children}</span>
      {count != null ? (
        <span
          className={[
            "rounded-md px-1.5 py-0.5 text-[10px] font-semibold tabular-nums",
            active ? "text-white" : "text-[#78716c]",
          ].join(" ")}
        >
          {count}
        </span>
      ) : null}
    </Link>
  );
}
