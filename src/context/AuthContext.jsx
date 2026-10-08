"use client";

/**
 * =============================================================================
 * AuthContext - сессия + подписка Free/PRO
 * =============================================================================
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { canAccessTerminal, isAdminRole } from "@/lib/roles";
import { redirectAfterLogin } from "@/lib/auth/redirect";
import {
  fetchMe,
  loginApi,
  logoutApi,
  registerApi,
  createPayment,
} from "@/lib/api/client";
import { allowDemoFallback } from "@/lib/runtimePolicy";
import {
  FREE_LIMITS,
  PLANS,
  PLAN_PRICES,
  defaultSubscription,
  isProActive,
  isSubscriptionExpired,
  daysLeft,
} from "@/lib/subscription";

const AuthContext = createContext(null);
const DEMO_STORAGE_KEY = "eh_demo_session";

function readDemoSession() {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DEMO_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeDemoSession(session) {
  if (typeof window === "undefined") return;
  if (!session) localStorage.removeItem(DEMO_STORAGE_KEY);
  else localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(session));
}

function normalizeProfile(p) {
  if (!p) return p;
  const subscription =
    p.subscription ||
    (isAdminRole(p.role)
      ? defaultSubscription(PLANS.PRO)
      : defaultSubscription(PLANS.FREE));
  return {
    ...p,
    subscription,
    usage: p.usage || { lotOpens: [], lotOpenCount: 0 },
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [paywallOpen, setPaywallOpen] = useState(false);
  const [paywallReason, setPaywallReason] = useState("");
  const [dbConfigured, setDbConfigured] = useState(null);
  /** "" | "unavailable" | "unconfigured" — не путать с «просто не залогинен» */
  const [sessionError, setSessionError] = useState("");
  const [sessionAttempt, setSessionAttempt] = useState(0);

  /**
   * Сессия только из PostgreSQL.
   * Firebase здесь больше не держит экран загрузки: его колбэк может не прийти,
   * и терминал оставался на «Загрузка терминала…» навсегда.
   * Демо из localStorage не подставляем, если база недоступна.
   */
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (cancelled) return;
      setSessionError((prev) => prev || "unavailable");
      setLoading(false);
    }, 8000);

    (async () => {
      try {
        const data = await fetchMe();
        if (cancelled) return;
        clearTimeout(timer);
        if (data.unavailable) {
          setDbConfigured(true);
          setSessionError("unavailable");
          setUser(null);
          setProfile(null);
          return;
        }
        if (!data.configured) {
          setDbConfigured(false);
          setSessionError("unconfigured");
          if (allowDemoFallback()) {
            const demo = readDemoSession();
            if (demo) {
              setUser(demo.user);
              setProfile(normalizeProfile(demo.profile));
              setSessionError("");
            }
          } else {
            setUser(null);
            setProfile(null);
          }
          return;
        }
        setDbConfigured(true);
        setSessionError("");
        if (data.profile) {
          const p = normalizeProfile(data.profile);
          setUser({
            uid: p.id,
            email: p.email,
            displayName: p.displayName,
            isPostgres: true,
          });
          setProfile(p);
        } else {
          setUser(null);
          setProfile(null);
        }
      } catch {
        if (cancelled) return;
        clearTimeout(timer);
        setDbConfigured(false);
        setSessionError("unavailable");
        setUser(null);
        setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [sessionAttempt]);

  const retrySession = useCallback(() => {
    setLoading(true);
    setSessionError("");
    setSessionAttempt((n) => n + 1);
  }, []);

  const persistProfile = useCallback((nextProfile, nextUser) => {
    setProfile(nextProfile);
    if (nextUser?.isDemo) {
      writeDemoSession({ user: nextUser, profile: nextProfile });
    }
  }, []);

  const applyDemoSession = useCallback((account) => {
    const demoUser = {
      uid: `demo-${account.role}`,
      email: account.email,
      displayName: account.displayName,
      isDemo: true,
    };
    const demoProfile = normalizeProfile({
      id: demoUser.uid,
      uid: demoUser.uid,
      email: demoUser.email,
      displayName: account.displayName,
      firstName: account.firstName || "",
      lastName: account.lastName || "",
      jobTitle: account.jobTitle || "",
      department: account.department || "",
      presence: account.presence || "online",
      avatarId: account.avatarId || "ocean",
      accent: account.accent || "sky",
      bio: account.bio || "",
      role: account.role,
      blocked: Boolean(account.blocked),
      subscription: account.subscription || defaultSubscription(PLANS.FREE),
      usage: { lotOpens: [], lotOpenCount: 0 },
    });
    writeDemoSession({ user: demoUser, profile: demoProfile });
    setUser(demoUser);
    setProfile(demoProfile);
    setError("");
    return redirectAfterLogin(account.role);
  }, []);

  const login = useCallback(
    async (email, password) => {
      setError("");
      try {
        const data = await loginApi(email, password);
        if (data.profile) {
          const p = normalizeProfile(data.profile);
          setUser({
            uid: p.id,
            email: p.email,
            displayName: p.displayName,
            isPostgres: true,
          });
          setProfile(p);
          setDbConfigured(true);
          return redirectAfterLogin(p.role);
        }
      } catch (e) {
        if (e.unavailable) {
          throw new Error("База временно недоступна. Попробуйте позже.");
        }
        if (!(e.status === 503 && e.configured === false && allowDemoFallback())) {
          throw e;
        }
      }

      if (
        process.env.NODE_ENV !== "production" &&
        process.env.NEXT_PUBLIC_ALLOW_DEMO === "1"
      ) {
        const { resolveTestAccount } = await import("@/data/testAccounts");
        const account = resolveTestAccount(email, password);
        if (!account) throw new Error("Неверный email или пароль");
        if (account.blocked) throw new Error("Аккаунт заблокирован");
        return applyDemoSession(account);
      }
      throw new Error("Неверный email или пароль");
    },
    [applyDemoSession]
  );

  const register = useCallback(async (email, password, displayName, extra = {}) => {
    setError("");
    try {
      const data = await registerApi(email, password, displayName, extra);
      if (data.profile) {
        const p = normalizeProfile(data.profile);
        setUser({
          uid: p.id,
          email: p.email,
          displayName: p.displayName,
          isPostgres: true,
        });
        setProfile(p);
        setDbConfigured(true);
        return;
      }
    } catch (e) {
      if (!(e.status === 503 && e.configured === false && allowDemoFallback())) {
        throw e.status === 503
          ? new Error(e.message || "База временно недоступна. Попробуйте позже.")
          : e;
      }
    }
    throw new Error("Регистрация недоступна без PostgreSQL.");
  }, []);

  const logout = useCallback(async () => {
    setError("");
    try {
      await logoutApi();
    } catch {
      /* demo / offline */
    }
    writeDemoSession(null);
    setUser(null);
    setProfile(null);
  }, []);

  const updateLocalProfile = useCallback((patch) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = normalizeProfile({ ...prev, ...patch });
      setUser((u) => {
        if (!u) return u;
        const nu = {
          ...u,
          displayName: next.displayName ?? patch.displayName ?? u.displayName,
        };
        if (u.isDemo) writeDemoSession({ user: nu, profile: next });
        return nu;
      });
      return next;
    });
  }, []);

  const openPaywall = useCallback((reason = "") => {
    setPaywallReason(reason);
    setPaywallOpen(true);
  }, []);

  const closePaywall = useCallback(() => {
    setPaywallOpen(false);
    setPaywallReason("");
  }, []);

  /**
   * Заявка на оплату PRO.
   * Postgres: POST /api/payments → pending (админ подтверждает).
   * Demo: локальная активация без сервера.
   */
  const activatePro = useCallback(
    async (planKey = "month") => {
      if (dbConfigured) {
        await createPayment(planKey);
        setPaywallOpen(false);
        return { pending: true };
      }
      const price = PLAN_PRICES[planKey] || PLAN_PRICES.month;
      setProfile((prev) => {
        if (!prev) return prev;
        const next = normalizeProfile({
          ...prev,
          subscription: {
            plan: PLANS.PRO,
            expiresAt: Date.now() + price.days * 86400000,
            source: "demo_payment",
            updatedAt: Date.now(),
            lastPlanId: price.id,
          },
        });
        setUser((u) => {
          if (u?.isDemo) writeDemoSession({ user: u, profile: next });
          return u;
        });
        return next;
      });
      setPaywallOpen(false);
      return { pending: false };
    },
    [dbConfigured]
  );

  /** Попытка открыть карточку лота - Free лимит */
  const tryOpenLot = useCallback(
    (lotId) => {
      if (!profile) return { ok: false };
      if (isAdminRole(profile.role) || isProActive(profile.subscription)) {
        return { ok: true };
      }
      const usage = profile.usage || { lotOpens: [], lotOpenCount: 0 };
      const opens = usage.lotOpens || [];
      if (opens.includes(lotId)) return { ok: true };
      if (opens.length >= FREE_LIMITS.maxLotOpens) {
        openPaywall("limit");
        return { ok: false, reason: "limit" };
      }
      const nextOpens = [...opens, lotId];
      const next = normalizeProfile({
        ...profile,
        usage: {
          lotOpens: nextOpens,
          lotOpenCount: nextOpens.length,
        },
      });
      persistProfile(next, user);
      return { ok: true };
    },
    [profile, user, openPaywall, persistProfile]
  );

  const requirePro = useCallback(
    (featureKey) => {
      if (isAdminRole(profile?.role) || isProActive(profile?.subscription)) {
        return true;
      }
      openPaywall(featureKey || "feature");
      return false;
    },
    [profile, openPaywall]
  );

  const pro = isProActive(profile?.subscription);
  const expired = isSubscriptionExpired(profile?.subscription);
  const left = daysLeft(profile?.subscription);

  const value = useMemo(
    () => ({
      user,
      profile,
      loading,
      error,
      sessionError,
      retrySession,
      setError,
      isConfigured: Boolean(dbConfigured),
      dbConfigured,
      role: profile?.role || null,
      blocked: Boolean(profile?.blocked),
      isAdmin: isAdminRole(profile?.role),
      canTerminal: canAccessTerminal(profile?.role) && !profile?.blocked,
      isPro: pro,
      subscriptionExpired: expired,
      daysLeft: left,
      freeLimits: FREE_LIMITS,
      lotOpensUsed: profile?.usage?.lotOpenCount || 0,
      login,
      register,
      logout,
      updateLocalProfile,
      tryOpenLot,
      requirePro,
      activatePro,
      paywallOpen,
      paywallReason,
      openPaywall,
      closePaywall,
      refreshProfile: async () => {
        const data = await fetchMe();
        if (data.profile) {
          setProfile(normalizeProfile(data.profile));
        }
      },
    }),
    [
      user,
      profile,
      loading,
      error,
      sessionError,
      retrySession,
      dbConfigured,
      pro,
      expired,
      left,
      login,
      register,
      logout,
      updateLocalProfile,
      tryOpenLot,
      requirePro,
      activatePro,
      paywallOpen,
      paywallReason,
      openPaywall,
      closePaywall,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth должен быть внутри <AuthProvider>");
  return ctx;
}
