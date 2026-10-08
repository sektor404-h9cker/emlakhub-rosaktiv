"use client";

/**
 * AdminDashboard - цифры дня + быстрые ссылки
 */

import Link from "next/link";
import {
  LayoutDashboard,
  Ticket,
  ShieldAlert,
  CheckSquare,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useSystem } from "@/context/SystemContext";
import { useUsers } from "@/hooks/useUsers";
import { usePaymentsJournal } from "@/hooks/usePaymentsJournal";
import { useSupportDesk } from "@/hooks/useSupportDesk";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";
import { isProActive } from "@/lib/subscription";
import AdminTour from "@/components/admin/AdminTour";

export default function AdminDashboard() {
  const { t, locale } = useAdminI18n();
  const { fraudCases, tasks } = useSystem();
  const { tickets } = useSupportDesk();
  const { users } = useUsers();
  const { rows: payments } = usePaymentsJournal();

  const [now, setNow] = useState(null);
  useEffect(() => {
    const id = setTimeout(() => setNow(Date.now()), 0);
    return () => clearTimeout(id);
  }, []);

  const stats = useMemo(() => {
    return {
      users: users.length,
      pro: users.filter((u) => isProActive(u.subscription)).length,
      tickets: tickets.filter((x) => x.status !== "closed").length,
      fraud: fraudCases.filter((f) => f.status !== "cleared").length,
      overdue: tasks.filter(
        (task) =>
          task.status !== "done" &&
          task.deadline &&
          now != null &&
          task.deadline < now
      ).length,
      stuck: payments.filter((p) => p.status === "stuck").length,
    };
  }, [users, tickets, fraudCases, tasks, payments, now]);

  const cards = [
    {
      label: t.dashMrr,
      value: locale === "az" ? "Məlumat yoxdur" : locale === "en" ? "No data" : "Нет данных",
      href: "/admin/finance",
      icon: Wallet,
    },
    {
      label: t.dashTickets,
      value: String(stats.tickets),
      href: "/admin/support",
      icon: Ticket,
    },
    {
      label: t.dashFraud,
      value: String(stats.fraud),
      href: "/admin/security",
      icon: ShieldAlert,
    },
    {
      label: t.dashTasksOverdue,
      value: String(stats.overdue),
      href: "/admin/tasks",
      icon: CheckSquare,
    },
    {
      label: t.dashUsers,
      value: String(stats.users),
      href: "/admin/users",
      icon: Users,
    },
    {
      label: t.dashPro,
      value: String(stats.pro),
      href: "/admin/users",
      icon: Users,
    },
  ];

  const quick = [
    { href: "/admin/users", label: t.navUsers },
    { href: "/admin/lots", label: t.navLots },
    { href: "/admin/finance", label: t.navFinance },
    { href: "/admin/support", label: t.navSupport },
    { href: "/admin/tasks", label: t.navTasks },
    { href: "/admin/team", label: t.navTeam },
    { href: "/admin/security", label: t.navSecurity },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#93c5fd]">
            Admin · home
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
            <LayoutDashboard size={22} className="text-[#60a5fa]" />
            {t.dashTitle}
          </h1>
          <p className="mt-1 text-[13px] text-[#9aa3ad]">{t.dashHint}</p>
        </div>
        <AdminTour />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4 transition hover:border-sky-400/30"
            >
              <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.12em] text-[#64748b]">
                <Icon size={14} />
                {c.label}
              </div>
              <div className="mt-2 font-mono text-[22px] text-white">
                {c.value}
              </div>
            </Link>
          );
        })}
      </div>

      {stats.stuck > 0 ? (
        <div className="rounded-2xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-100">
          {stats.stuck} stuck payment(s) →{" "}
          <Link href="/admin/finance" className="underline">
            {t.financeJournal}
          </Link>
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
        <h2 className="text-[14px] font-semibold text-white">{t.dashQuick}</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {quick.map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="rounded-xl border border-white/10 px-3 py-2 text-[12px] text-[#93c5fd] hover:border-sky-400/40"
            >
              {q.label}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
