"use client";

/**
 * SystemContext — статус платформы + демо-реестр пользователей для админки
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ROLES } from "@/lib/firebase/constants";
import { PLANS, defaultSubscription } from "@/lib/subscription";

const SystemContext = createContext(null);
const SYSTEM_KEY = "eh_system_v1";
const USERS_KEY = "eh_admin_users_v1";

export const SYSTEM_TEMPLATES = [
  {
    id: "ok",
    status: "ok",
    titleAz: "Hamısı işləyir",
    titleRu: "Всё работает",
    messageAz: "",
    messageRu: "",
  },
  {
    id: "maintenance",
    status: "maintenance",
    titleAz: "Texniki işlər",
    titleRu: "Технические работы",
    messageAz:
      "Terminal müvəqqəti bağlıdır. Tezliklə qayıdacağıq — təşəkkür edirik.",
    messageRu:
      "Терминал временно закрыт на обслуживание. Скоро вернёмся — спасибо за терпение.",
  },
  {
    id: "incident",
    status: "incident",
    titleAz: "Sistemdə nasazlıq",
    titleRu: "Сбой в системе",
    messageAz:
      "Gözlənilməz problem aşkarlandı. Komandamız artıq işləyir. Zəhmət olmasa sonra yenidən yoxlayın.",
    messageRu:
      "Обнаружена внезапная проблема. Команда уже работает. Пожалуйста, зайдите позже.",
  },
  {
    id: "payment",
    status: "incident",
    titleAz: "Ödəniş sistemi",
    titleRu: "Платежная система",
    messageAz: "Ödənişlər müvəqqəti dayandırılıb. Analiz oxumaq olar, PRO alınması sonra.",
    messageRu:
      "Оплаты временно приостановлены. Читать анализ можно, оформить PRO — чуть позже.",
  },
];

const SEED_USERS = [
  {
    id: "demo-admin",
    email: "admin@emlakhub.net",
    displayName: "Admin Demo",
    role: ROLES.ADMIN,
    blocked: false,
    subscription: defaultSubscription(PLANS.PRO),
  },
  {
    id: "demo-investor",
    email: "investor@emlakhub.net",
    displayName: "Investor Demo",
    role: ROLES.INVESTOR,
    blocked: false,
    subscription: defaultSubscription(PLANS.FREE),
    usage: { lotOpens: [], lotOpenCount: 0 },
  },
  {
    id: "demo-developer",
    email: "dev@emlakhub.net",
    displayName: "Developer Demo",
    role: ROLES.DEVELOPER,
    blocked: false,
    subscription: defaultSubscription(PLANS.PRO),
  },
  {
    id: "demo-support",
    email: "support@emlakhub.net",
    displayName: "Support Demo",
    role: ROLES.SUPPORT,
    blocked: false,
    subscription: defaultSubscription(PLANS.PRO),
  },
];

function readJson(key, fallback) {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key, value) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function SystemProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);
  const [system, setSystem] = useState({
    status: "ok",
    templateId: "ok",
    titleRu: "",
    titleAz: "",
    messageRu: "",
    messageAz: "",
    updatedAt: Date.now(),
  });
  const [users, setUsers] = useState(SEED_USERS);

  useEffect(() => {
    const s = readJson(SYSTEM_KEY, null);
    const u = readJson(USERS_KEY, null);
    if (s) setSystem(s);
    if (u?.length) setUsers(u);
    else writeJson(USERS_KEY, SEED_USERS);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(SYSTEM_KEY, system);
  }, [system, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    writeJson(USERS_KEY, users);
  }, [users, hydrated]);

  const applyTemplate = useCallback((templateId) => {
    const t = SYSTEM_TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    setSystem({
      status: t.status,
      templateId: t.id,
      titleRu: t.titleRu,
      titleAz: t.titleAz,
      messageRu: t.messageRu,
      messageAz: t.messageAz,
      updatedAt: Date.now(),
    });
  }, []);

  const setCustomStatus = useCallback((patch) => {
    setSystem((prev) => ({ ...prev, ...patch, updatedAt: Date.now() }));
  }, []);

  const upsertUser = useCallback((user) => {
    setUsers((prev) => {
      const i = prev.findIndex((u) => u.id === user.id || u.email === user.email);
      if (i >= 0) {
        const next = [...prev];
        next[i] = { ...next[i], ...user };
        return next;
      }
      return [{ ...user, id: user.id || `u-${Date.now()}` }, ...prev];
    });
  }, []);

  const deleteUser = useCallback((id) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
  }, []);

  const createUser = useCallback(({ email, displayName, role, plan }) => {
    const id = `u-${Date.now()}`;
    const row = {
      id,
      email: email.trim().toLowerCase(),
      displayName: displayName.trim() || email.split("@")[0],
      role: role || ROLES.INVESTOR,
      blocked: false,
      subscription:
        plan === PLANS.PRO
          ? defaultSubscription(PLANS.PRO, 30)
          : defaultSubscription(PLANS.FREE),
      usage: { lotOpens: [], lotOpenCount: 0 },
      createdAt: Date.now(),
    };
    setUsers((prev) => [row, ...prev]);
    return row;
  }, []);

  const value = useMemo(
    () => ({
      hydrated,
      system,
      users,
      applyTemplate,
      setCustomStatus,
      upsertUser,
      deleteUser,
      createUser,
      setUsers,
      isLocked: system.status === "maintenance" || system.status === "incident",
    }),
    [
      hydrated,
      system,
      users,
      applyTemplate,
      setCustomStatus,
      upsertUser,
      deleteUser,
      createUser,
    ]
  );

  return (
    <SystemContext.Provider value={value}>{children}</SystemContext.Provider>
  );
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error("useSystem must be inside SystemProvider");
  return ctx;
}
