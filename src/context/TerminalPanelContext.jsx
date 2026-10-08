"use client";

/**
 * =============================================================================
 * TerminalPanelContext - избранное, сравнение, портфель, алерты, гид, prefs
 * =============================================================================
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "@/context/AuthContext";
import {
  DEMO_ALERTS,
  DEMO_BALANCE,
  DEMO_DEALS,
  DEMO_NOTIFICATIONS,
  DEMO_TICKETS,
} from "@/data/demoPanel";

function storageKey(userId) {
  return userId ? `eh-terminal-panel-v2:${userId}` : "eh-terminal-panel-v2:anon";
}
const TerminalPanelContext = createContext(null);

const DEFAULT_PREFS = {
  company: "",
  focus: "both", // auto | estate | land | both
  risk: "balanced", // cautious | balanced | aggressive
  notifyEmail: true,
  notifyPush: true,
  showGuides: true,
  avatarId: "ocean",
};

const DEFAULT_STATE = {
  watchlist: [],
  compare: [],
  deals: DEMO_DEALS,
  alerts: DEMO_ALERTS,
  notifications: DEMO_NOTIFICATIONS,
  tickets: DEMO_TICKETS,
  balance: DEMO_BALANCE,
  prefs: DEFAULT_PREFS,
  onboardingDone: false,
  tourOpen: false,
  tourStep: 0,
};

function loadState(userId) {
  if (typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_STATE,
      ...parsed,
      prefs: { ...DEFAULT_PREFS, ...(parsed.prefs || {}) },
      tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
      deals: Array.isArray(parsed.deals) ? parsed.deals : [],
      alerts: Array.isArray(parsed.alerts) ? parsed.alerts : [],
      notifications: Array.isArray(parsed.notifications)
        ? parsed.notifications
        : [],
      watchlist: Array.isArray(parsed.watchlist) ? parsed.watchlist : [],
      compare: Array.isArray(parsed.compare) ? parsed.compare : [],
      balance: typeof parsed.balance === "number" ? parsed.balance : 0,
      tourOpen: false,
      tourStep: 0,
    };
  } catch {
    return DEFAULT_STATE;
  }
}

export function TerminalPanelProvider({ children }) {
  const { profile } = useAuth();
  const userId = profile?.id || null;
  const [boundUser, setBoundUser] = useState(userId);
  const [state, setState] = useState(DEFAULT_STATE);
  const [hydrated, setHydrated] = useState(false);
  const skipSave = useRef(true);
  const serverReady = useRef(false);

  if (userId !== boundUser) {
    setBoundUser(userId);
    setState(loadState(userId));
    setHydrated(false);
  }

  useEffect(() => {
    let cancelled = false;
    skipSave.current = true;
    serverReady.current = false;
    const local = loadState(userId);
    (async () => {
      let next = local;
      let fromServer = false;
      if (userId) {
        try {
          const res = await fetch("/api/me/workspace", { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            const server = data.workspace;
            next = {
              ...local,
              watchlist: Array.isArray(server?.watchlist) ? server.watchlist : [],
              compare: Array.isArray(server?.compare) ? server.compare : [],
              deals: Array.isArray(server?.deals) ? server.deals : [],
              alerts: Array.isArray(server?.alerts) ? server.alerts : [],
            };
            fromServer = true;
          }
        } catch {
          /* show the cache; do not write it back */
        }
      }
      if (cancelled) return;
      serverReady.current = fromServer;
      setState(next);
      setHydrated(true);
      skipSave.current = !fromServer;
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!hydrated || skipSave.current || !serverReady.current) return undefined;
    try {
      const { tourOpen, tourStep, ...persist } = state;
      void tourOpen;
      void tourStep;
      window.localStorage.setItem(
        storageKey(userId),
        JSON.stringify({ ...persist, tourOpen: false, tourStep: 0 })
      );
    } catch {
      /* ignore */
    }
    if (!userId) return undefined;
    const handle = setTimeout(() => {
      fetch("/api/me/workspace", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          watchlist: state.watchlist,
          compare: state.compare,
          deals: state.deals,
          alerts: state.alerts,
        }),
      }).catch(() => {});
    }, 400);
    return () => clearTimeout(handle);
  }, [state, hydrated, userId]);

  const toggleWatch = useCallback((lotId) => {
    setState((prev) => {
      const has = prev.watchlist.includes(lotId);
      return {
        ...prev,
        watchlist: has
          ? prev.watchlist.filter((id) => id !== lotId)
          : [...prev.watchlist, lotId],
      };
    });
  }, []);

  const toggleCompare = useCallback((lotId) => {
    setState((prev) => {
      if (prev.compare.includes(lotId)) {
        return { ...prev, compare: prev.compare.filter((id) => id !== lotId) };
      }
      if (prev.compare.length >= 3) {
        return { ...prev, compare: [...prev.compare.slice(1), lotId] };
      }
      return { ...prev, compare: [...prev.compare, lotId] };
    });
  }, []);

  const clearCompare = useCallback(() => {
    setState((prev) => ({ ...prev, compare: [] }));
  }, []);

  const removeDeal = useCallback((dealId) => {
    setState((prev) => ({
      ...prev,
      deals: prev.deals.filter((deal) => deal.id !== dealId),
    }));
  }, []);

  const setDealStage = useCallback((dealId, stage) => {
    setState((prev) => ({
      ...prev,
      deals: prev.deals.map((d) =>
        d.id === dealId
          ? { ...d, stage, updatedAt: new Date().toISOString().slice(0, 10) }
          : d
      ),
    }));
  }, []);

  const addDealFromLot = useCallback((lotId, bid) => {
    setState((prev) => {
      if (prev.deals.some((d) => d.lotId === lotId && d.stage !== "result")) {
        return prev;
      }
      const deal = {
        id: `D-${Date.now().toString(36)}`,
        lotId,
        stage: "explore",
        bid: Number.isFinite(Number(bid)) ? Number(bid) : null,
        noteAz: "İzləmədən portfelə əlavə edildi",
        noteRu: "Добавлено в портфель из избранного",
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      return { ...prev, deals: [deal, ...prev.deals] };
    });
  }, []);

  const toggleAlert = useCallback((alertId) => {
    setState((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) =>
        a.id === alertId ? { ...a, enabled: !a.enabled } : a
      ),
    }));
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, unread: false })),
    }));
  }, []);

  const clearNotifications = useCallback(() => {
    setState((prev) => ({ ...prev, notifications: [] }));
  }, []);

  const savePrefs = useCallback((patch) => {
    setState((prev) => ({
      ...prev,
      prefs: { ...prev.prefs, ...patch },
    }));
  }, []);

  const setShowGuides = useCallback((showGuides) => {
    setState((prev) => ({
      ...prev,
      prefs: { ...prev.prefs, showGuides },
    }));
  }, []);

  const addTicket = useCallback((ticket) => {
    setState((prev) => ({
      ...prev,
      tickets: [
        {
          id: `T-${1040 + prev.tickets.length + 1}`,
          status: "open",
          createdAt: new Date().toLocaleDateString("ru-RU", {
            day: "numeric",
            month: "short",
          }),
          replyAz: null,
          replyRu: null,
          ...ticket,
        },
        ...prev.tickets,
      ],
    }));
  }, []);

  const setTicketStatus = useCallback((id, status) => {
    setState((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => (t.id === id ? { ...t, status } : t)),
    }));
  }, []);

  const startTour = useCallback(() => {
    setState((prev) => ({ ...prev, tourOpen: true, tourStep: 0 }));
  }, []);

  const setTourStep = useCallback((step) => {
    setState((prev) => ({ ...prev, tourStep: step }));
  }, []);

  const closeTour = useCallback(() => {
    setState((prev) => ({
      ...prev,
      tourOpen: false,
      onboardingDone: true,
    }));
  }, []);

  const completeTour = useCallback(() => {
    setState((prev) => ({
      ...prev,
      tourOpen: false,
      onboardingDone: true,
      tourStep: 0,
    }));
  }, []);

  const unreadCount = useMemo(
    () => state.notifications.filter((n) => n.unread).length,
    [state.notifications]
  );

  const value = useMemo(
    () => ({
      ...state,
      hydrated,
      unreadCount,
      toggleWatch,
      toggleCompare,
      clearCompare,
      setDealStage,
      removeDeal,
      addDealFromLot,
      toggleAlert,
      markAllNotificationsRead,
      clearNotifications,
      savePrefs,
      setShowGuides,
      addTicket,
      setTicketStatus,
      startTour,
      setTourStep,
      closeTour,
      completeTour,
      isWatched: (id) => state.watchlist.includes(id),
      isCompared: (id) => state.compare.includes(id),
    }),
    [
      state,
      hydrated,
      unreadCount,
      toggleWatch,
      toggleCompare,
      clearCompare,
      setDealStage,
      removeDeal,
      addDealFromLot,
      toggleAlert,
      markAllNotificationsRead,
      clearNotifications,
      savePrefs,
      setShowGuides,
      addTicket,
      setTicketStatus,
      startTour,
      setTourStep,
      closeTour,
      completeTour,
    ]
  );

  return (
    <TerminalPanelContext.Provider value={value}>
      {children}
    </TerminalPanelContext.Provider>
  );
}

export function useTerminalPanel() {
  const ctx = useContext(TerminalPanelContext);
  if (!ctx) {
    throw new Error("useTerminalPanel must be used within TerminalPanelProvider");
  }
  return ctx;
}
