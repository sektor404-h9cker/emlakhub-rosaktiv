"use client";

/**
 * =============================================================================
 * AuthContext — сессия пользователя + профиль Firestore
 * =============================================================================
 * Оборачивает приложение (см. Providers.jsx).
 *
 * DEMO-режим (Firebase не настроен):
 *   login(email, password) → тестовые аккаунты из src/data/testAccounts.js
 *   см. src/data/TEST_ACCESS.md
 *
 * Прод:
 *   Firebase Auth email/password + документ users/{uid}
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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // Firebase User | demo object
  const [profile, setProfile] = useState(null); // Firestore profile
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /* ---------- подписка на Auth / DEMO ---------- */
  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      const demo = readDemoSession();
      if (demo) {
        setUser(demo.user);
        setProfile(demo.profile);
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
        setProfile(p);
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

  /* ---------- действия ---------- */

  const applyDemoSession = useCallback((account) => {
    const demoUser = {
      uid: `demo-${account.role}`,
      email: account.email,
      displayName: account.displayName,
      isDemo: true,
    };
    const demoProfile = {
      id: demoUser.uid,
      uid: demoUser.uid,
      email: demoUser.email,
      displayName: demoUser.displayName,
      role: account.role,
      blocked: Boolean(account.blocked),
    };
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
        if (!account) {
          throw new Error("Неверный email или пароль");
        }
        if (account.blocked) {
          throw new Error("Аккаунт заблокирован");
        }
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
    if (displayName) {
      await updateProfile(cred.user, { displayName });
    }
    await ensureUserProfile(cred.user, { displayName, role: ROLES.INVESTOR });
  }, []);

  const logout = useCallback(async () => {
    setError("");
    writeDemoSession(null);
    setUser(null);
    setProfile(null);
    if (isFirebaseConfigured && auth) {
      await signOut(auth);
    }
  }, []);

  /** Локальное обновление профиля (демо + отображаемое имя) */
  const updateLocalProfile = useCallback((patch) => {
    setProfile((prev) => {
      if (!prev) return prev;
      const next = { ...prev, ...patch };
      setUser((u) => {
        if (!u) return u;
        const nu = {
          ...u,
          displayName: patch.displayName ?? u.displayName,
        };
        if (u.isDemo) {
          writeDemoSession({ user: nu, profile: next });
        }
        return nu;
      });
      return next;
    });
  }, []);

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
      login,
      register,
      logout,
      updateLocalProfile,
    }),
    [user, profile, loading, error, login, register, logout, updateLocalProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth должен быть внутри <AuthProvider>");
  return ctx;
}
