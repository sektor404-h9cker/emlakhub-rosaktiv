"use client";

/**
 * SystemContext - платформа, пользователи, security ops, тикеты, финансы
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { ROLES, ROLE_LABELS } from "@/lib/roles";
import { allowDemoFallback } from "@/lib/runtimePolicy";
import {
  PLANS,
  defaultSubscription,
  adjustSubscriptionDays,
} from "@/lib/subscription";
import {
  DEFAULT_ROLE_PRIVILEGES,
  clonePrivileges,
  hasPrivilege as hasPrivStatic,
  adminHomeForRole as homeStatic,
  roleHasAnyAdminAccess,
  PRIV,
} from "@/lib/adminPrivileges";
import { DEMO_PAYMENTS } from "@/lib/financeDemo";
import { SECURITY_TEMPLATES } from "@/lib/securityTemplates";
import {
  getFraudScenario,
  scenarioCopy,
} from "@/lib/fraudIntel";
import {
  seedTeamChannels,
  seedTasks,
  defaultAdminSettings,
} from "@/lib/adminOpsSeed";
const SystemContext = createContext(null);

/** Лоты, пользователи, тикеты и платежи живут в PostgreSQL, не в браузере. */
function seedAdminLots() {
  return [];
}

function seedAdminNotifications() {
  return [];
}

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
      "Terminal müvəqqəti bağlıdır. Tezliklə qayıdacağıq - təşəkkür edirik.",
    messageRu:
      "Терминал временно закрыт на обслуживание. Скоро вернёмся - спасибо за терпение.",
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
    messageAz:
      "Ödənişlər müvəqqəti dayandırılıb. Analiz oxumaq olar, PRO alınması sonra.",
    messageRu:
      "Оплаты временно приостановлены. Читать анализ можно, оформить PRO - чуть позже.",
  },
];

const SEED_USERS = [];

function seedAudit() {
  return [];
}

function seedFraud() {
  return [];
}

function seedSoc() {
  return [];
}

function seedTickets() {
  return [];
}

function seedNotices() {
  return [];
}

function defaultOps() {
  return {
    privilegeMatrix: clonePrivileges(),
    customRoles: [],
    auditLogs: seedAudit(),
    fraudCases: seedFraud(),
    socAlerts: seedSoc(),
    tickets: seedTickets(),
    securityNotices: seedNotices(),
    payments: allowDemoFallback() ? DEMO_PAYMENTS : [],
    teamChannels: seedTeamChannels(),
    tasks: seedTasks(),
    adminSettings: defaultAdminSettings(),
    adminLots: seedAdminLots(),
    adminNotifications: seedAdminNotifications(),
  };
}

function mergeOps(raw) {
  const base = defaultOps();
  if (!raw || typeof raw !== "object") return base;
  const rawMatrix = raw.privilegeMatrix || {};
  const privilegeMatrix = { ...base.privilegeMatrix };
  for (const [role, privs] of Object.entries(rawMatrix)) {
    const fromBase = base.privilegeMatrix[role] || [];
    privilegeMatrix[role] = [...new Set([...(privs || []), ...fromBase])];
  }
  return {
    ...base,
    ...raw,
    privilegeMatrix,
    customRoles: Array.isArray(raw.customRoles) ? raw.customRoles : [],
    teamChannels: Array.isArray(raw.teamChannels)
      ? raw.teamChannels
      : base.teamChannels,
    tasks: Array.isArray(raw.tasks) ? raw.tasks : base.tasks,
    adminSettings: {
      ...base.adminSettings,
      ...(raw.adminSettings || {}),
    },
    adminLots: Array.isArray(raw.adminLots) ? raw.adminLots : base.adminLots,
    adminNotifications: Array.isArray(raw.adminNotifications)
      ? raw.adminNotifications
      : base.adminNotifications,
    payments: allowDemoFallback() ? DEMO_PAYMENTS : [],
    tickets: [],
    adminLots: [],
  };
}

function opsForServer(ops) {
  const { payments, tickets, adminLots, ...rest } = ops;
  void payments;
  void tickets;
  void adminLots;
  return rest;
}

export function SystemProvider({ children }) {
  const [hydrated, setHydrated] = useState(false);
  const [canWrite, setCanWrite] = useState(false);
  const [system, setSystem] = useState({
    status: "ok",
    templateId: "ok",
    titleRu: "",
    titleAz: "",
    messageRu: "",
    messageAz: "",
    updatedAt: 0,
  });
  const [users, setUsers] = useState(SEED_USERS);
  const [ops, setOps] = useState(defaultOps);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/platform", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.configured) return;
        if (data.system && typeof data.system === "object") {
          setSystem((prev) => ({ ...prev, ...data.system }));
        }
        if (data.ops && typeof data.ops === "object") {
          setOps(mergeOps(data.ops));
        }
        if (Array.isArray(data.users)) setUsers(data.users);
        setCanWrite(Boolean(data.canWrite));
      })
      .catch((err) => {
        console.error("[platform]", err);
      })
      .finally(() => {
        if (!cancelled) setHydrated(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!hydrated || !canWrite) return undefined;
    const timer = setTimeout(() => {
      fetch("/api/admin/platform", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ system, ops: opsForServer(ops) }),
      }).catch((err) => {
        console.error("[platform]", err);
      });
    }, 400);
    return () => clearTimeout(timer);
  }, [system, ops, hydrated, canWrite]);

  const pushAudit = useCallback((who, action, level = "info") => {
    setOps((prev) => ({
      ...prev,
      auditLogs: [
        {
          id: `a-${Date.now()}`,
          at: Date.now(),
          who: who || "system",
          action,
          level,
        },
        ...prev.auditLogs,
      ].slice(0, 200),
    }));
  }, []);

  const applyTemplate = useCallback(
    (templateId, who) => {
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
      pushAudit(who, `Системный шаблон: ${t.titleRu}`, "warn");
    },
    [pushAudit]
  );

  const setCustomStatus = useCallback((patch) => {
    setSystem((prev) => ({ ...prev, ...patch, updatedAt: Date.now() }));
  }, []);

  const upsertUser = useCallback((user) => {
    setUsers((prev) => {
      const i = prev.findIndex(
        (u) => u.id === user.id || u.email === user.email
      );
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

  const createUser = useCallback(
    ({
      email,
      displayName,
      firstName,
      lastName,
      role,
      plan,
      phone,
      company,
      lastIp,
      lastGeo,
      lastDevice,
      accountStatus,
    }) => {
      const id = `u-${Date.now()}`;
      const name =
        [firstName, lastName].filter(Boolean).join(" ").trim() ||
        displayName?.trim() ||
        email.split("@")[0];
      const row = {
        id,
        email: email.trim().toLowerCase(),
        firstName: firstName?.trim() || "",
        lastName: lastName?.trim() || "",
        displayName: name,
        phone: phone?.trim() || "",
        company: company?.trim() || "",
        role: role || ROLES.INVESTOR,
        blocked: accountStatus === "blocked",
        accountStatus: accountStatus || "active",
        lastIp: lastIp || "0.0.0.0",
        lastGeo: lastGeo || "Baku, AZ",
        lastDevice: lastDevice || "Unknown",
        riskScore: 10,
        paymentAttempts: 0,
        failedLogins: 0,
        sessions: [],
        avatarId: "ocean",
        subscription:
          plan === PLANS.PRO
            ? defaultSubscription(PLANS.PRO, 30)
            : defaultSubscription(PLANS.FREE),
        usage: { lotOpens: [], lotOpenCount: 0 },
        notes: "",
        createdAt: Date.now(),
        lastActiveAt: Date.now(),
      };
      setUsers((prev) => [row, ...prev]);
      return row;
    },
    []
  );

  /* -- privileges / roles -- */
  const setRolePrivileges = useCallback((role, privs) => {
    setOps((prev) => ({
      ...prev,
      privilegeMatrix: { ...prev.privilegeMatrix, [role]: [...privs] },
    }));
  }, []);

  const togglePrivilege = useCallback((role, priv) => {
    setOps((prev) => {
      const cur = prev.privilegeMatrix[role] || [];
      const next = cur.includes(priv)
        ? cur.filter((p) => p !== priv)
        : [...cur, priv];
      return {
        ...prev,
        privilegeMatrix: { ...prev.privilegeMatrix, [role]: next },
      };
    });
  }, []);

  const addCustomRole = useCallback(({ id, label, privileges }) => {
    const rid = (id || label || "")
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_|_$/g, "");
    if (!rid || rid === ROLES.INVESTOR) return null;
    setOps((prev) => {
      if (prev.privilegeMatrix[rid] || prev.customRoles.some((r) => r.id === rid))
        return prev;
      return {
        ...prev,
        customRoles: [
          ...prev.customRoles,
          { id: rid, label: label || rid, createdAt: Date.now() },
        ],
        privilegeMatrix: {
          ...prev.privilegeMatrix,
          [rid]: privileges?.length
            ? [...privileges]
            : [PRIV.SUPPORT, PRIV.SECURITY],
        },
      };
    });
    return rid;
  }, []);

  const deleteCustomRole = useCallback((roleId) => {
    if (Object.values(ROLES).includes(roleId)) return false;
    setOps((prev) => {
      const { [roleId]: _, ...rest } = prev.privilegeMatrix;
      return {
        ...prev,
        customRoles: prev.customRoles.filter((r) => r.id !== roleId),
        privilegeMatrix: rest,
      };
    });
    setUsers((prev) =>
      prev.map((u) =>
        u.role === roleId ? { ...u, role: ROLES.INVESTOR } : u
      )
    );
    return true;
  }, []);

  const renameCustomRole = useCallback((roleId, label) => {
    setOps((prev) => ({
      ...prev,
      customRoles: prev.customRoles.map((r) =>
        r.id === roleId ? { ...r, label } : r
      ),
    }));
  }, []);

  /* -- audit -- */
  const updateAuditLog = useCallback((id, patch) => {
    setOps((prev) => ({
      ...prev,
      auditLogs: prev.auditLogs.map((l) =>
        l.id === id ? { ...l, ...patch } : l
      ),
    }));
  }, []);

  const deleteAuditLog = useCallback((id) => {
    setOps((prev) => ({
      ...prev,
      auditLogs: prev.auditLogs.filter((l) => l.id !== id),
    }));
  }, []);

  const clearAuditLogs = useCallback((olderThanMs) => {
    setOps((prev) => ({
      ...prev,
      auditLogs: olderThanMs
        ? prev.auditLogs.filter((l) => l.at > Date.now() - olderThanMs)
        : [],
    }));
  }, []);

  /* -- fraud / soc -- */
  const setFraudStatus = useCallback((id, status) => {
    setOps((prev) => ({
      ...prev,
      fraudCases: prev.fraudCases.map((f) =>
        f.id === id ? { ...f, status } : f
      ),
    }));
  }, []);

  const deleteFraudCase = useCallback((id) => {
    setOps((prev) => ({
      ...prev,
      fraudCases: prev.fraudCases.filter((f) => f.id !== id),
    }));
  }, []);

  const addFraudCase = useCallback((row) => {
    setOps((prev) => ({
      ...prev,
      fraudCases: [
        {
          id: row.id || `F-${Date.now() % 10000}`,
          userEmail: row.userEmail,
          score: Number(row.score) || 50,
          reason: row.reason || "Ручной флаг",
          scenarioId: row.scenarioId || null,
          ticketId: row.ticketId || null,
          status: row.status || "open",
          meta: row.meta || {},
          at: Date.now(),
        },
        ...prev.fraudCases,
      ],
    }));
  }, []);

  /**
   * Умный антифрод: сценарий → кейс + автотикет в поддержку
   * с системным объяснением и готовым черновиком ответа
   */
  const raiseFraudIntel = useCallback(
    ({ scenarioId, userEmail, locale = "ru", meta = {}, who }) => {
      const scenario = getFraudScenario(scenarioId);
      if (!scenario || !userEmail) return null;
      const copy = scenarioCopy(scenario, locale);
      const fraudId = `F-${Date.now() % 100000}`;
      const ticketId = `T-${1000 + (Date.now() % 9000)}`;
      const user = users.find((u) => u.email === userEmail);
      const userName = user?.displayName || userEmail;
      const attempts =
        meta.attempts ??
        user?.paymentAttempts ??
        scenario.defaultCount ??
        null;

      const systemText = [
        `Автосигнал антифрода · ${copy.title}`,
        `Сигнал: ${copy.signal}${attempts != null ? ` (факт: ${attempts})` : ""}`,
        `Score: ${scenario.score} · severity: ${scenario.severity}`,
        user?.lastIp ? `IP: ${user.lastIp} · ${user.lastGeo || ""}` : null,
        user?.lastDevice ? `Device: ${user.lastDevice}` : null,
        "",
        `Почему это странно:`,
        copy.explain,
        "",
        `Рекомендации: ${(scenario.recommend || []).join(" · ")}`,
        copy.userHint ? `Подсказка агенту: ${copy.userHint}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const level =
        scenario.severity === "critical" || scenario.severity === "high"
          ? "L2"
          : "L1";

      setOps((prev) => ({
        ...prev,
        fraudCases: [
          {
            id: fraudId,
            userEmail,
            score: scenario.score,
            reason: copy.signal,
            scenarioId: scenario.id,
            ticketId,
            status: "open",
            meta: { ...meta, attempts },
            at: Date.now(),
          },
          ...prev.fraudCases,
        ],
        tickets: [
          {
            id: ticketId,
            subject: copy.supportSubject,
            userEmail,
            userName,
            level,
            status: "open",
            priority:
              scenario.severity === "critical" ? "high" : "normal",
            source: "fraud_intel",
            scenarioId: scenario.id,
            fraudId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [
              {
                id: `m-${Date.now()}`,
                from: "system",
                text: systemText,
                at: Date.now(),
              },
              {
                id: `m-${Date.now() + 1}`,
                from: "agent",
                level,
                text: copy.agentDraft,
                suggested: true,
                at: Date.now() + 1,
              },
            ],
          },
          ...prev.tickets,
        ],
        adminNotifications: [
          {
            id: `an-${Date.now()}`,
            type: "fraud",
            title: `Fraud ${fraudId} → ${ticketId}`,
            body: `${copy.title}: ${userEmail}`,
            href: "/admin/support",
            at: Date.now(),
            read: false,
          },
          ...(prev.adminNotifications || []),
        ].slice(0, 40),
        auditLogs: [
          {
            id: `a-${Date.now()}`,
            at: Date.now(),
            who: who || "system",
            action: `Fraud intel ${scenario.id} → ${userEmail} · ticket ${ticketId}`,
            level: "warn",
          },
          ...prev.auditLogs,
        ].slice(0, 200),
      }));

      const nextStatus =
        scenario.severity === "critical" ? "risk" : "review";
      setUsers((prev) =>
        prev.map((u) =>
          u.email === userEmail
            ? {
                ...u,
                accountStatus: nextStatus,
                riskScore: Math.max(u.riskScore || 0, scenario.score),
                paymentAttempts:
                  scenarioId === "pay_loop" || scenarioId === "card_stack"
                    ? Math.max(u.paymentAttempts || 0, attempts || 0)
                    : u.paymentAttempts,
              }
            : u
        )
      );

      return { fraudId, ticketId, scenarioId };
    },
    [users]
  );

  const setSocStatus = useCallback((id, status) => {
    setOps((prev) => ({
      ...prev,
      socAlerts: prev.socAlerts.map((s) =>
        s.id === id ? { ...s, status } : s
      ),
    }));
  }, []);

  const deleteSocAlert = useCallback((id) => {
    setOps((prev) => ({
      ...prev,
      socAlerts: prev.socAlerts.filter((s) => s.id !== id),
    }));
  }, []);

  const addSocAlert = useCallback((row) => {
    setOps((prev) => ({
      ...prev,
      socAlerts: [
        {
          id: row.id || `SOC-${Date.now() % 1000}`,
          severity: row.severity || "medium",
          title: row.title,
          detail: row.detail || "",
          status: "active",
          at: Date.now(),
        },
        ...prev.socAlerts,
      ],
    }));
  }, []);

  /* -- security notices -- */
  const sendSecurityNotice = useCallback((templateId, target = "all") => {
    const t = SECURITY_TEMPLATES.find((x) => x.id === templateId);
    if (!t) return;
    setOps((prev) => ({
      ...prev,
      securityNotices: [
        {
          id: `n-${Date.now()}`,
          templateId: t.id,
          titleRu: t.titleRu,
          bodyRu: t.bodyRu,
          severity: t.severity,
          target,
          at: Date.now(),
          from: "Департамент безопасности Emlak Hub",
        },
        ...prev.securityNotices,
      ].slice(0, 50),
    }));
  }, []);

  const deleteSecurityNotice = useCallback((id) => {
    setOps((prev) => ({
      ...prev,
      securityNotices: prev.securityNotices.filter((n) => n.id !== id),
    }));
  }, []);

  /* -- tickets -- */
  const upsertTicket = useCallback((ticket) => {
    setOps((prev) => {
      const i = prev.tickets.findIndex((t) => t.id === ticket.id);
      if (i >= 0) {
        const next = [...prev.tickets];
        next[i] = { ...next[i], ...ticket, updatedAt: Date.now() };
        return { ...prev, tickets: next };
      }
      return {
        ...prev,
        tickets: [
          {
            ...ticket,
            id: ticket.id || `T-${Date.now() % 100000}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: ticket.messages || [],
          },
          ...prev.tickets,
        ],
      };
    });
  }, []);

  const setTicketStatus = useCallback((id, status) => {
    setOps((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) =>
        t.id === id ? { ...t, status, updatedAt: Date.now() } : t
      ),
    }));
  }, []);

  const setTicketLevel = useCallback((id, level) => {
    setOps((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) =>
        t.id === id ? { ...t, level, updatedAt: Date.now() } : t
      ),
    }));
  }, []);

  const addTicketMessage = useCallback((ticketId, message) => {
    setOps((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          updatedAt: Date.now(),
          status: t.status === "closed" ? "open" : t.status,
          messages: [
            ...t.messages,
            {
              id: `m-${Date.now()}`,
              at: Date.now(),
              ...message,
            },
          ],
        };
      }),
    }));
  }, []);

  const editTicketMessage = useCallback((ticketId, msgId, patch) => {
    setOps((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          messages: t.messages.map((m) =>
            m.id === msgId ? { ...m, ...patch } : m
          ),
        };
      }),
    }));
  }, []);

  const deleteTicketMessage = useCallback((ticketId, msgId) => {
    setOps((prev) => ({
      ...prev,
      tickets: prev.tickets.map((t) => {
        if (t.id !== ticketId) return t;
        return {
          ...t,
          messages: t.messages.filter((m) => m.id !== msgId),
        };
      }),
    }));
  }, []);

  const deleteTicket = useCallback((id) => {
    setOps((prev) => ({
      ...prev,
      tickets: prev.tickets.filter((t) => t.id !== id),
    }));
  }, []);

  /* -- payments -- */
  const setPaymentStatus = useCallback((id, status) => {
    setOps((prev) => ({
      ...prev,
      payments: prev.payments.map((p) =>
        p.id === id ? { ...p, status } : p
      ),
    }));
  }, []);

  const adjustUserDays = useCallback((userId, deltaDays) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        return {
          ...u,
          subscription: adjustSubscriptionDays(u.subscription, deltaDays),
        };
      })
    );
  }, []);

  const wipeUserSensitive = useCallback((userId, fields = []) => {
    const set = new Set(
      fields.length
        ? fields
        : ["usage", "notes", "phone", "company", "sessions"]
    );
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        const next = { ...u };
        if (set.has("usage")) next.usage = { lotOpens: [], lotOpenCount: 0 };
        if (set.has("notes")) next.notes = "";
        if (set.has("phone")) next.phone = "";
        if (set.has("company")) next.company = "";
        if (set.has("sessions")) next.sessions = [];
        if (set.has("displayName"))
          next.displayName = next.email?.split("@")[0] || "user";
        if (set.has("avatar")) next.avatarId = null;
        next.wipedAt = Date.now();
        return next;
      })
    );
  }, []);

  const sendTeamMessage = useCallback((channelId, message) => {
    setOps((prev) => ({
      ...prev,
      teamChannels: prev.teamChannels.map((ch) => {
        if (ch.id !== channelId) return ch;
        return {
          ...ch,
          messages: [
            ...ch.messages,
            {
              id: `tm-${Date.now()}`,
              at: Date.now(),
              ...message,
            },
          ],
        };
      }),
    }));
  }, []);

  const createTeamChannel = useCallback((channel) => {
    const id = channel.id || `ch-${Date.now()}`;
    setOps((prev) => ({
      ...prev,
      teamChannels: [
        {
          id,
          type: channel.type || "group",
          name: channel.name,
          desc: channel.desc || "",
          members: channel.members || ["all"],
          messages: [],
        },
        ...prev.teamChannels,
      ],
    }));
    return id;
  }, []);

  const deleteTeamChannel = useCallback((id) => {
    if (id === "ch-general") return false;
    setOps((prev) => ({
      ...prev,
      teamChannels: prev.teamChannels.filter((c) => c.id !== id),
    }));
    return true;
  }, []);

  const upsertTask = useCallback((task) => {
    setOps((prev) => {
      const i = prev.tasks.findIndex((t) => t.id === task.id);
      if (i >= 0) {
        const next = [...prev.tasks];
        next[i] = { ...next[i], ...task, updatedAt: Date.now() };
        return { ...prev, tasks: next };
      }
      return {
        ...prev,
        tasks: [
          {
            ...task,
            id: task.id || `task-${Date.now()}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            comments: task.comments || [],
            status: task.status || "todo",
          },
          ...prev.tasks,
        ],
      };
    });
  }, []);

  const setTaskStatus = useCallback((id, status) => {
    setOps((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) =>
        t.id === id ? { ...t, status, updatedAt: Date.now() } : t
      ),
    }));
  }, []);

  const addTaskComment = useCallback((taskId, comment) => {
    setOps((prev) => ({
      ...prev,
      tasks: prev.tasks.map((t) => {
        if (t.id !== taskId) return t;
        return {
          ...t,
          updatedAt: Date.now(),
          comments: [
            ...(t.comments || []),
            {
              id: `c-${Date.now()}`,
              at: Date.now(),
              ...comment,
            },
          ],
        };
      }),
    }));
  }, []);

  const deleteTask = useCallback((id) => {
    setOps((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((t) => t.id !== id),
    }));
  }, []);

  const updateAdminSettings = useCallback((patch) => {
    setOps((prev) => ({
      ...prev,
      adminSettings: { ...prev.adminSettings, ...patch },
    }));
  }, []);

  const upsertAdminLot = useCallback((lot) => {
    setOps((prev) => {
      const i = prev.adminLots.findIndex((l) => l.id === lot.id);
      if (i < 0) return { ...prev, adminLots: [lot, ...prev.adminLots] };
      const next = [...prev.adminLots];
      next[i] = { ...next[i], ...lot };
      return { ...prev, adminLots: next };
    });
  }, []);

  const markAdminNotifRead = useCallback((id) => {
    setOps((prev) => ({
      ...prev,
      adminNotifications: prev.adminNotifications.map((n) =>
        n.id === id || id === "all" ? { ...n, read: true } : n
      ),
    }));
  }, []);

  const pushAdminNotif = useCallback((row) => {
    setOps((prev) => ({
      ...prev,
      adminNotifications: [
        {
          id: `an-${Date.now()}`,
          at: Date.now(),
          read: false,
          ...row,
        },
        ...prev.adminNotifications,
      ].slice(0, 40),
    }));
  }, []);

  const addPayment = useCallback((row) => {
    setOps((prev) => ({
      ...prev,
      payments: [
        {
          id: row.id || `pay-${Date.now() % 100000}`,
          userEmail: row.userEmail,
          plan: row.plan || "PRO · 30 дн",
          amount: Number(row.amount) || 0,
          status: row.status || "pending",
          at: row.at || Date.now(),
          method: row.method || "card",
          note: row.note || "",
        },
        ...prev.payments,
      ],
    }));
  }, []);

  const deletePayment = useCallback((id) => {
    setOps((prev) => ({
      ...prev,
      payments: prev.payments.filter((p) => p.id !== id),
    }));
  }, []);

  const roleLabels = useMemo(() => {
    const map = { ...ROLE_LABELS };
    for (const r of ops.customRoles) map[r.id] = r.label;
    return map;
  }, [ops.customRoles]);

  const allRoleIds = useMemo(() => {
    const base = Object.values(ROLES);
    const custom = ops.customRoles.map((r) => r.id);
    return [...new Set([...base, ...custom])];
  }, [ops.customRoles]);

  const hasPrivilege = useCallback(
    (role, priv) => hasPrivStatic(role, priv, ops.privilegeMatrix),
    [ops.privilegeMatrix]
  );

  const adminHomeForRole = useCallback(
    (role) => homeStatic(role, ops.privilegeMatrix),
    [ops.privilegeMatrix]
  );

  const isAdminCapable = useCallback(
    (role) => roleHasAnyAdminAccess(role, ops.privilegeMatrix),
    [ops.privilegeMatrix]
  );

  const value = useMemo(
    () => ({
      hydrated,
      system,
      users,
      ops,
      privilegeMatrix: ops.privilegeMatrix,
      customRoles: ops.customRoles,
      auditLogs: ops.auditLogs,
      fraudCases: ops.fraudCases,
      socAlerts: ops.socAlerts,
      tickets: ops.tickets,
      securityNotices: ops.securityNotices,
      payments: ops.payments,
      teamChannels: ops.teamChannels,
      tasks: ops.tasks,
      adminSettings: ops.adminSettings,
      adminLots: ops.adminLots,
      adminNotifications: ops.adminNotifications,
      roleLabels,
      allRoleIds,
      applyTemplate,
      setCustomStatus,
      upsertUser,
      deleteUser,
      createUser,
      setUsers,
      pushAudit,
      setRolePrivileges,
      togglePrivilege,
      addCustomRole,
      deleteCustomRole,
      renameCustomRole,
      updateAuditLog,
      deleteAuditLog,
      clearAuditLogs,
      setFraudStatus,
      deleteFraudCase,
      addFraudCase,
      raiseFraudIntel,
      setSocStatus,
      deleteSocAlert,
      addSocAlert,
      sendSecurityNotice,
      deleteSecurityNotice,
      upsertTicket,
      setTicketStatus,
      setTicketLevel,
      addTicketMessage,
      editTicketMessage,
      deleteTicketMessage,
      deleteTicket,
      setPaymentStatus,
      addPayment,
      deletePayment,
      adjustUserDays,
      wipeUserSensitive,
      sendTeamMessage,
      createTeamChannel,
      deleteTeamChannel,
      upsertTask,
      setTaskStatus,
      addTaskComment,
      deleteTask,
      updateAdminSettings,
      upsertAdminLot,
      markAdminNotifRead,
      pushAdminNotif,
      hasPrivilege,
      adminHomeForRole,
      isAdminCapable,
      isLocked: system.status === "maintenance" || system.status === "incident",
    }),
    [
      hydrated,
      system,
      users,
      ops,
      roleLabels,
      allRoleIds,
      applyTemplate,
      setCustomStatus,
      upsertUser,
      deleteUser,
      createUser,
      pushAudit,
      setRolePrivileges,
      togglePrivilege,
      addCustomRole,
      deleteCustomRole,
      renameCustomRole,
      updateAuditLog,
      deleteAuditLog,
      clearAuditLogs,
      setFraudStatus,
      deleteFraudCase,
      addFraudCase,
      raiseFraudIntel,
      setSocStatus,
      deleteSocAlert,
      addSocAlert,
      sendSecurityNotice,
      deleteSecurityNotice,
      upsertTicket,
      setTicketStatus,
      setTicketLevel,
      addTicketMessage,
      editTicketMessage,
      deleteTicketMessage,
      deleteTicket,
      setPaymentStatus,
      addPayment,
      deletePayment,
      adjustUserDays,
      wipeUserSensitive,
      sendTeamMessage,
      createTeamChannel,
      deleteTeamChannel,
      upsertTask,
      setTaskStatus,
      addTaskComment,
      deleteTask,
      updateAdminSettings,
      upsertAdminLot,
      markAdminNotifRead,
      pushAdminNotif,
      hasPrivilege,
      adminHomeForRole,
      isAdminCapable,
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
