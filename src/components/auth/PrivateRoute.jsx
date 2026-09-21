"use client";

/**
 * PrivateRoute — сессия + роль + привилегия раздела админки
 */

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { hasPrivilege, PRIV, adminHomeForRole } from "@/lib/adminPrivileges";

function privForPath(pathname) {
  if (!pathname) return null;
  if (pathname.startsWith("/admin/users")) return PRIV.USERS;
  if (pathname.startsWith("/admin/finance")) return PRIV.FINANCE;
  if (pathname.startsWith("/admin/support")) return PRIV.SUPPORT;
  if (pathname.startsWith("/admin/system")) return PRIV.SYSTEM;
  if (pathname.startsWith("/admin/security")) return PRIV.SECURITY;
  if (pathname === "/admin" || pathname === "/admin/") return PRIV.USERS;
  return PRIV.USERS;
}

export default function PrivateRoute({
  children,
  requireAdmin = false,
  adminPath = "",
}) {
  const router = useRouter();
  const { loading, user, profile, blocked, isAdmin, canTerminal, role } =
    useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (blocked) return;
    if (requireAdmin && !isAdmin) {
      router.replace("/dashboard");
      return;
    }
    if (requireAdmin && isAdmin) {
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
    user,
    blocked,
    isAdmin,
    canTerminal,
    requireAdmin,
    adminPath,
    role,
    router,
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

  if (!user) return null;

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

  if (requireAdmin && !isAdmin) return null;
  if (requireAdmin && isAdmin) {
    const need = privForPath(adminPath);
    if (need && !hasPrivilege(role, need)) return null;
  }
  if (!requireAdmin && !canTerminal) return null;

  return children;
}
