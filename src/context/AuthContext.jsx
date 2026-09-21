"use client";

/**
 * =============================================================================
 * AuthContext — сессия + подписка Free/PRO
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
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase/config";
import { ensureUserProfile, getUserProfile } from "@/lib/firebase/firestore";
import { ROLES, canAccessTerminal, isAdminRole } from "@/lib/firebase/constants";
import {
  redirectAfterLogin,
  resolveTestAccount,
} from "@/data/testAccounts";
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

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      const demo = readDemoSession();
      if (demo) {
        setUser(demo.user);
        setProfile(normalizeProfile(demo.profile));
      }
      setLoading(false);
      return undefined;
    }

    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      setLoading(true);
      setError("");
      if (!fbUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      try {
        let p = await getUserProfile(fbUser.uid);
        if (!p) p = await ensureUserProfile(fbUser);
        setUser(fbUser);
        setProfile(normalizeProfile(p));
      } catch (e) {
        setError(e.message || "Ошибка профиля");
        setUser(fbUser);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
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
      displayName: demoUser.displayName,
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
      if (!isFirebaseConfigured || !auth) {
        const account = resolveTestAccount(email, password);
        if (!account) throw new Error("Неверный email или пароль");
        if (account.blocked) throw new Error("Аккаунт заблокирован");
        return applyDemoSession(account);
      }
      const cred = await signInWithEmailAndPassword(auth, email, password);
      let p = await getUserProfile(cred.user.uid);
      if (!p) p = await ensureUserProfile(cred.user);
      if (p?.blocked) {
        await signOut(auth);
        throw new Error("Аккаунт заблокирован");
      }
      return redirectAfterLogin(p?.role);
    },
    [applyDemoSession]
  );

  const register = useCallback(async (email, password, displayName) => {
    setError("");
    if (!isFirebaseConfigured || !auth) {
      throw new Error("Регистрация пока недоступна. Войдите по выданному доступу.");
    }
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName) await updateProfile(cred.user, { displayName });
    await ensureUserProfile(cred.user, { displayName, role: ROLES.INVESTOR });
  }, []);

  const logout = useCallback(async () => {
    setError("");
    writeDemoSession(null);
    setUser(null);
    setProfile(null);
    if (isFirebaseConfigured && auth) await signOut(auth);
  }, []);

  const updateLocalProfile = useCallback((patch) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = normalizeProfile({ ...prev, ...patch });
      setUser((u) => {
        if (!u) return u;
        const nu = {
          ...u,
          displayName: patch.displayName ?? u.displayName,
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

  /** Демо-оплата PRO */
  const activatePro = useCallback(
    (planKey = "month") => {
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
    },
    []
  );

  /** Попытка открыть карточку лота — Free лимит */
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
      setError,
      isConfigured: isFirebaseConfigured,
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
    }),
    [
      user,
      profile,
      loading,
      error,
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
