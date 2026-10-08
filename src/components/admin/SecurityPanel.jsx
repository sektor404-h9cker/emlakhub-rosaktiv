"use client";

/**
 * SecurityPanel - понятная панель безопасности + live-логи
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Shield,
  KeyRound,
  Eye,
  Radar,
  Ban,
  Trash2,
  Plus,
  Send,
  Pencil,
  ShieldAlert,
  Activity,
  Lock,
  Smartphone,
  Globe,
  Users,
  Circle,
} from "lucide-react";
import { useSystem } from "@/context/SystemContext";
import { useAuth } from "@/context/AuthContext";
import { PRIV, PRIV_LABELS } from "@/lib/adminPrivileges";
import { ROLES } from "@/lib/roles";
import {
  SECURITY_TEMPLATES,
  SEVERITY_META,
} from "@/lib/securityTemplates";
import {
  FRAUD_SCENARIOS,
  scenarioCopy,
  getFraudScenario,
} from "@/lib/fraudIntel";
import TermHint from "@/components/terminal/TermHint";
import Link from "next/link";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";

const TABS = [
  {
    id: "overview",
    label: "Сейчас",
    hint: "Главный экран: статус, быстрые действия и живая лента",
  },
  {
    id: "roles",
    label: "Кто что видит",
    hint: "Роли и доступ к разделам админки",
  },
  {
    id: "soc",
    label: "Мониторинг",
    hint: "SOC - круглосуточный контроль странных событий",
  },
  {
    id: "fraud",
    label: "Антифрод",
    hint: "Подозрительные оплаты и аккаунты",
  },
  {
    id: "templates",
    label: "Письма людям",
    hint: "Готовые тексты от Департамента безопасности",
  },
  {
    id: "sessions",
    label: "Сессии",
    hint: "Кто сейчас в системе и политика входа",
  },
];

const LIVE_DEMO = [];

const SESSION_SEED = [];

export default function SecurityPanel() {
  const {
    users,
    system,
    privilegeMatrix,
    customRoles,
    auditLogs,
    fraudCases,
    socAlerts,
    securityNotices,
    roleLabels,
    allRoleIds,
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
    pushAudit,
  } = useSystem();
  const { profile } = useAuth();
  const { locale } = useAdminI18n();
  const [tab, setTab] = useState("overview");
  const [live, setLive] = useState(true);
  const [roleForm, setRoleForm] = useState({ id: "", label: "" });
  const [fraudForm, setFraudForm] = useState({
    userEmail: "",
    score: "70",
    reason: "",
  });
  const [intelScenario, setIntelScenario] = useState("pay_loop");
  const [intelUser, setIntelUser] = useState("r.aliyev@mail.az");
  const [intelResult, setIntelResult] = useState(null);
  const [socForm, setSocForm] = useState({
    title: "",
    detail: "",
    severity: "medium",
  });
  const [editAudit, setEditAudit] = useState(null);
  const [note, setNote] = useState("");
  const [require2fa] = useState(false);
  const [sessions, setSessions] = useState(SESSION_SEED);
  const [flashId, setFlashId] = useState(null);
  const liveIdx = useRef(0);
  const feedRef = useRef(null);

  const blocked = useMemo(
    () => users.filter((u) => u.blocked).length,
    [users]
  );
  const openFraud = fraudCases.filter((f) => f.status !== "cleared").length;
  const activeSoc = socAlerts.filter((s) => s.status === "active").length;
  const who = profile?.email || "admin";

  useEffect(() => {
    if (!live || LIVE_DEMO.length === 0) return undefined;
    const tick = () => {
      const sample = LIVE_DEMO[liveIdx.current % LIVE_DEMO.length];
      liveIdx.current += 1;
      const id = `live-${Date.now()}`;
      pushAudit("live-feed", sample.action, sample.level);
      setFlashId(id);
      window.setTimeout(() => setFlashId(null), 1200);
      if (feedRef.current) feedRef.current.scrollTop = 0;
    };
    const id = window.setInterval(tick, 4200);
    return () => window.clearInterval(id);
  }, [live, pushAudit]);

  const levelCls = (level) => {
    if (level === "warn") return "text-[#f5d0a9]";
    if (level === "critical" || level === "error") return "text-[#f0b4b4]";
    if (level === "ok") return "text-[#d6d3d1]";
    return "text-[#e7e5e4]";
  };

  return (
    <div className="max-w-6xl space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.14em] text-[#78716c]">
            Admin · security
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-[22px] font-semibold tracking-tight text-white">
            <Shield size={18} className="text-[#a8a29e]" />
            Безопасность
          </h1>
          <p className="mt-1 max-w-xl text-[13px] leading-relaxed text-[#9aa3ad]">
            Простыми словами: кто заходит, что подозрительно, кому какой
            доступ, и что написать человеку при риске.
          </p>
          {note ? (
            <p className="mt-2 text-[12px] text-emerald-400/90">{note}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => setLive((v) => !v)}
          className={[
            "inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[12px] transition",
            live ? "bg-white text-[#0b0d12]" : "text-[#a8a29e] hover:text-white",
          ].join(" ")}
        >
          <span
            className={[
              "h-1.5 w-1.5 rounded-full",
              live ? "bg-[#0b0d12]" : "bg-[#78716c]",
            ].join(" ")}
          />
          {live ? "Live-логи включены" : "Live выключен"}
        </button>
      </header>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            title={t.hint}
            onClick={() => setTab(t.id)}
            className={[
              "shrink-0 border-b px-3 py-2 text-[13px] transition",
              tab === t.id
                ? "border-white text-white"
                : "border-transparent text-[#a8a29e] hover:text-white",
            ].join(" ")}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "overview" ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <Stat
                icon={KeyRound}
                label="Вы вошли как"
                value={profile?.email || "-"}
                tip="Текущий аккаунт в админке"
              />
              <Stat
                icon={Ban}
                label="Заблокированы"
                value={String(blocked)}
                tip="Сколько аккаунтов нельзя пускать в терминал"
              />
              <Stat
                icon={Radar}
                label="Алерты SOC"
                value={String(activeSoc)}
                tip="Активные сигналы мониторинга прямо сейчас"
              />
              <Stat
                icon={Eye}
                label="Fraud на проверке"
                value={String(openFraud)}
                tip="Подозрительные оплаты / аккаунты без «cleared»"
              />
            </div>

            <section className="border-t border-white/[0.08] pt-4">
              <h2 className="flex items-center gap-2 text-[14px] font-semibold text-white">
                <Activity size={16} className="text-[#60a5fa]" />
                Быстрые меры
                <TermHint text="Если что-то пошло не так - сначала здесь. Потом можно углубиться во вкладки." />
              </h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <Quick
                  href="/admin/system"
                  title="Остановить терминал"
                  desc="Техработы или сбой - экран у всех пользователей"
                  tone="rose"
                />
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch("/api/admin/sessions/revoke", {
                      method: "POST",
                      credentials: "include",
                    });
                    if (!res.ok) {
                      setNote("Сессии не отозваны.");
                      return;
                    }
                    window.location.assign("/login");
                  }}
                  className="border-b border-white/[0.06] py-3 text-left"
                >
                  <div className="text-[13px] font-medium text-amber-50">
                    Выгнать всех из сессий
                  </div>
                  <div className="mt-0.5 text-[11px] text-amber-100/70">
                    Просят войти заново - полезно при утечке
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNote("2FA не подключена. Вход остаётся по email и паролю.");
                  }}
                  className="border-b border-white/[0.06] py-3 text-left"
                >
                  <div className="text-[13px] font-medium text-sky-50">
                    Включить 2FA админам
                  </div>
                  <div className="mt-0.5 text-[11px] text-sky-100/70">
                    Второй шаг при входе в /admin
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => setTab("templates")}
                  className="border-b border-white/[0.06] py-3 text-left"
                >
                  <div className="text-[13px] font-medium text-white">
                    Написать людям от Sec
                  </div>
                  <div className="mt-0.5 text-[11px] text-[#9aa3ad]">
                    Готовые тексты про фишинг, пароль, блокировку
                  </div>
                </button>
              </div>
              <p className="mt-3 font-mono text-[11px] text-[#64748b]">
                Платформа сейчас:{" "}
                <span className="text-[#93c5fd]">{system.status}</span>
                {" · "}
                шаблон {system.templateId || "-"}
              </p>
            </section>

            <section className="border-t border-white/[0.08] pt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[14px] font-semibold text-white">
                  Журнал (можно чистить)
                </h2>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      clearAuditLogs(86400000 * 7);
                      setNote("Удалены записи старше 7 дней");
                    }}
                    className="rounded-lg border border-white/10 px-2.5 py-1 text-[11px] text-[#9aa3ad]"
                  >
                    Старше 7 дней
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      clearAuditLogs();
                      setNote("Журнал очищен");
                    }}
                    className="rounded-lg border border-rose-400/30 px-2.5 py-1 text-[11px] text-rose-200"
                  >
                    Очистить всё
                  </button>
                </div>
              </div>
              <ul className="mt-3 max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {auditLogs.slice(0, 12).map((row) => (
                  <LogRow
                    key={row.id}
                    row={row}
                    editing={editAudit === row.id}
                    onEdit={() => setEditAudit(row.id)}
                    onCancel={() => setEditAudit(null)}
                    onSave={(text) => {
                      updateAuditLog(row.id, { action: text });
                      setEditAudit(null);
                    }}
                    onDelete={() => deleteAuditLog(row.id)}
                    levelCls={levelCls}
                  />
                ))}
              </ul>
            </section>
          </div>

          <LiveFeed
            feedRef={feedRef}
            live={live}
            logs={auditLogs}
            flashId={flashId}
            levelCls={levelCls}
          />
        </div>
      ) : null}

      {tab === "roles" ? (
        <div className="space-y-4">
          <Explain
            title="Кто что видит в админке"
            text="Каждая роль - набор доступов. Нажимайте на кнопку раздела, чтобы включить или выключить. Инвестор в админку не ходит."
          />
          <section className="border border-white/[0.08] p-4">
            <div className="space-y-3">
              {allRoleIds.map((role) => {
                const privs = privilegeMatrix[role] || [];
                const isCustom = customRoles.some((r) => r.id === role);
                return (
                  <div
                    key={role}
                    className="rounded-2xl border border-white/[0.07] bg-white/[0.02] p-3.5"
                  >
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-[14px] font-medium text-white">
                          {roleLabels[role] || role}
                        </div>
                        <div className="font-mono text-[10px] text-[#64748b]">
                          {role}
                          {privs.length
                            ? ` · ${privs.length} раздел(а)`
                            : " · только терминал"}
                        </div>
                      </div>
                      {isCustom ? (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="text-[11px] text-[#93c5fd]"
                            onClick={() => {
                              const label = window.prompt(
                                "Новое имя роли",
                                roleLabels[role]
                              );
                              if (label?.trim()) {
                                renameCustomRole(role, label.trim());
                                setNote("Роль переименована");
                              }
                            }}
                          >
                            Переименовать
                          </button>
                          <button
                            type="button"
                            className="text-[11px] text-rose-300"
                            onClick={() => {
                              deleteCustomRole(role);
                              pushAudit(who, `Удалена роль ${role}`, "warn");
                              setNote("Роль удалена");
                            }}
                          >
                            Удалить
                          </button>
                        </div>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {Object.values(PRIV).map((p) => {
                        const on = privs.includes(p);
                        const locked =
                          role === ROLES.ADMIN && p === PRIV.SECURITY;
                        return (
                          <button
                            key={p}
                            type="button"
                            disabled={locked}
                            onClick={() => {
                              togglePrivilege(role, p);
                              pushAudit(
                                who,
                                `${on ? "Снят" : "Выдан"} доступ «${PRIV_LABELS[p]}» → ${roleLabels[role] || role}`,
                                "warn"
                              );
                            }}
                            className={[
                              "rounded-lg border px-2.5 py-1.5 text-[11px] transition",
                              on
                                ? "border-sky-400/40 bg-sky-500/15 text-sky-50"
                                : "border-white/10 text-[#64748b] hover:text-[#94a3b8]",
                              locked ? "cursor-not-allowed opacity-50" : "",
                            ].join(" ")}
                          >
                            {PRIV_LABELS[p]}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const id = addCustomRole({
                ...roleForm,
                privileges: [PRIV.SUPPORT, PRIV.SECURITY],
              });
              if (id) {
                pushAudit(who, `Создана роль ${id}`, "warn");
                setNote(
                  `Роль «${roleForm.label || id}» создана. По умолчанию: Поддержка + Безопасность (можно менять выше).`
                );
                setRoleForm({ id: "", label: "" });
              } else setNote("Не удалось создать роль");
            }}
            className="grid gap-3 rounded-2xl border border-dashed border-sky-400/25 bg-sky-500/[0.04] p-4 sm:grid-cols-[1fr_1fr_auto]"
          >
            <div className="sm:col-span-2">
              <p className="mb-2 text-[12px] text-[#9aa3ad]">
                Новая роль для админки. Сразу сможет смотреть роли и поддержку -
                дальше настройте кнопками выше.
              </p>
            </div>
            <input
              className="eh-term-input"
              placeholder="id (analyst)"
              value={roleForm.id}
              onChange={(e) =>
                setRoleForm((f) => ({ ...f, id: e.target.value }))
              }
            />
            <input
              className="eh-term-input"
              placeholder="Название на русском"
              value={roleForm.label}
              onChange={(e) =>
                setRoleForm((f) => ({ ...f, label: e.target.value }))
              }
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2.5 text-[13px] font-semibold text-white"
            >
              <Plus size={14} /> Создать роль
            </button>
          </form>
        </div>
      ) : null}

      {tab === "soc" ? (
        <div className="space-y-4">
          <Explain
            title="Мониторинг (SOC)"
            text="SOC смотрит на странности: много попыток входа, сканирование лотов, странные сессии. Статусы: active - горит, watching - следим, resolved - закрыли."
          />
          <SocFraudForms
            mode="soc"
            socForm={socForm}
            setSocForm={setSocForm}
            onAdd={() => {
              if (!socForm.title.trim()) return;
              addSocAlert(socForm);
              pushAudit(who, `SOC: ${socForm.title}`, "warn");
              setSocForm({ title: "", detail: "", severity: "medium" });
              setNote("Алерт добавлен");
            }}
          />
          <div className="space-y-2">
            {socAlerts.map((s) => (
              <article
                key={s.id}
                className="border border-white/[0.08] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Radar size={14} className="text-[#60a5fa]" />
                      <h3 className="text-[14px] font-medium text-white">
                        {s.title}
                      </h3>
                      <span className="rounded-md bg-white/5 px-1.5 py-0.5 font-mono text-[10px] uppercase text-[#94a3b8]">
                        {s.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-[12px] text-[#9aa3ad]">{s.detail}</p>
                    <p className="mt-1 font-mono text-[10px] text-[#64748b]">
                      {s.id} · {fmtTime(s.at)}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {["active", "watching", "resolved"].map((st) => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setSocStatus(s.id, st)}
                        className={[
                          "rounded-lg px-2 py-1 text-[10px]",
                          s.status === st
                            ? "bg-sky-500/20 text-sky-100"
                            : "text-[#64748b] hover:text-white",
                        ].join(" ")}
                      >
                        {st}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        deleteSocAlert(s.id);
                        setNote("Алерт удалён");
                      }}
                      className="rounded-lg p-1 text-rose-300"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {tab === "fraud" ? (
        <div className="space-y-4">
          <Explain
            title="Умный антифрод"
            text="Система видит странный паттерн → создаёт кейс и сразу пишет в поддержку с объяснением и готовым текстом ответа клиенту."
          />

          <section className="rounded-2xl border border-rose-400/25 bg-gradient-to-br from-rose-500/[0.08] to-[#0a0c12] p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="text-[14px] font-semibold text-white">
                  Сигнал → автотикет в поддержку
                </h3>
                <p className="mt-1 text-[12px] text-rose-100/70">
                  Выбери ситуацию (например 10 попыток оплаты) и пользователя.
                  Поддержка получит черновик ответа.
                </p>
              </div>
              <TermHint text="Демо: имитация детекции. В проде это триггерит бэкенд по событиям платежей/логинов." />
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {FRAUD_SCENARIOS.map((s) => {
                const c = scenarioCopy(s, locale);
                const on = intelScenario === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setIntelScenario(s.id)}
                    className={[
                      "rounded-xl border p-3 text-left transition",
                      on
                        ? "border-rose-400/50 bg-rose-500/15"
                        : "border-white/10 bg-black/20 hover:border-white/20",
                    ].join(" ")}
                  >
                    <div className="font-mono text-[10px] text-rose-200/80">
                      {s.icon}
                    </div>
                    <div className="mt-1 text-[13px] font-medium text-white">
                      {c.title}
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#9aa3ad]">
                      {c.signal}
                    </div>
                    <div className="mt-2 font-mono text-[10px] text-rose-200">
                      score {s.score} · {s.severity}
                    </div>
                  </button>
                );
              })}
            </div>

            {(() => {
              const sc = getFraudScenario(intelScenario);
              const c = scenarioCopy(sc, locale);
              return (
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1fr]">
                  <div className="rounded-xl border border-white/10 bg-black/25 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-[#64748b]">
                      Почему странно
                    </div>
                    <p className="mt-1.5 text-[13px] leading-relaxed text-[#e2e8f0]">
                      {c.explain}
                    </p>
                    <ul className="mt-2 flex flex-wrap gap-1.5">
                      {(sc?.recommend || []).map((r) => (
                        <li
                          key={r}
                          className="rounded-md bg-white/5 px-2 py-0.5 text-[10px] text-[#93c5fd]"
                        >
                          {r}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="rounded-xl border border-emerald-400/20 bg-emerald-500/10 p-3">
                    <div className="text-[11px] uppercase tracking-wide text-emerald-200/70">
                      Черновик для поддержки
                    </div>
                    <p className="mt-1.5 text-[12px] leading-relaxed text-emerald-50/90">
                      {c.agentDraft}
                    </p>
                  </div>
                </div>
              );
            })()}

            <div className="mt-4 flex flex-wrap items-end gap-2">
              <label className="block min-w-[220px] flex-1 text-[11px] text-[#9aa3ad]">
                Пользователь
                <select
                  className="eh-term-input mt-1"
                  value={intelUser}
                  onChange={(e) => setIntelUser(e.target.value)}
                >
                  {users.map((u) => (
                    <option key={u.id} value={u.email}>
                      {u.displayName} · {u.email}
                      {u.paymentAttempts ? ` · ${u.paymentAttempts} pay` : ""}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={() => {
                  const res = raiseFraudIntel({
                    scenarioId: intelScenario,
                    userEmail: intelUser,
                    locale,
                    who: who,
                    meta: {
                      attempts:
                        users.find((u) => u.email === intelUser)
                          ?.paymentAttempts || undefined,
                    },
                  });
                  setIntelResult(res);
                  setNote(
                    res
                      ? `Сигнал → кейс ${res.fraudId} + тикет ${res.ticketId}`
                      : "Не удалось"
                  );
                }}
                className="rounded-xl bg-rose-500 px-4 py-2.5 text-[13px] font-semibold text-white"
              >
                Зафиксировать и открыть тикет
              </button>
              {intelResult ? (
                <Link
                  href="/admin/support"
                  className="rounded-xl border border-sky-400/30 px-3 py-2.5 text-[12px] text-sky-200"
                >
                  Открыть поддержку → {intelResult.ticketId}
                </Link>
              ) : null}
            </div>
          </section>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!fraudForm.userEmail.trim()) return;
              addFraudCase(fraudForm);
              pushAudit(who, `Fraud: ${fraudForm.userEmail}`, "warn");
              setFraudForm({ userEmail: "", score: "70", reason: "" });
              setNote("Ручной кейс создан");
            }}
            className="grid gap-2 border border-white/[0.08] p-4 sm:grid-cols-4"
          >
            <input
              className="eh-term-input"
              placeholder="email (ручной флаг)"
              value={fraudForm.userEmail}
              onChange={(e) =>
                setFraudForm((f) => ({ ...f, userEmail: e.target.value }))
              }
            />
            <input
              className="eh-term-input"
              placeholder="score 0-100"
              value={fraudForm.score}
              onChange={(e) =>
                setFraudForm((f) => ({ ...f, score: e.target.value }))
              }
            />
            <input
              className="eh-term-input"
              placeholder="Почему подозрительно"
              value={fraudForm.reason}
              onChange={(e) =>
                setFraudForm((f) => ({ ...f, reason: e.target.value }))
              }
            />
            <button
              type="submit"
              className="rounded-xl bg-[#2563eb] px-3 py-2 text-[12px] font-semibold text-white"
            >
              Пометить вручную
            </button>
          </form>
          <div className="overflow-x-auto border border-white/[0.08]">
            <table className="w-full min-w-[720px] text-left text-[13px]">
              <thead>
                <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-[0.14em] text-[#64748b]">
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Score</th>
                  <th className="px-4 py-3">Сценарий</th>
                  <th className="px-4 py-3">Тикет</th>
                  <th className="px-4 py-3">Статус</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {fraudCases.map((f) => (
                  <tr key={f.id} className="border-b border-white/[0.06]">
                    <td className="px-4 py-3 font-mono text-[11px] text-[#9aa3ad]">
                      {f.id}
                    </td>
                    <td className="px-4 py-3 text-white">{f.userEmail}</td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={f.score} />
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[#9aa3ad]">
                      {f.scenarioId
                        ? scenarioCopy(getFraudScenario(f.scenarioId), locale)
                            .title
                        : f.reason}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-sky-300">
                      {f.ticketId || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <select
                        className="eh-term-input py-1 text-[11px]"
                        value={f.status}
                        onChange={(e) => setFraudStatus(f.id, e.target.value)}
                      >
                        <option value="open">open</option>
                        <option value="review">review</option>
                        <option value="cleared">cleared</option>
                        <option value="blocked">blocked</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => deleteFraudCase(f.id)}
                        className="text-rose-300"
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {tab === "templates" ? (
        <div className="space-y-4">
          <Explain
            title="Письма от Департамента безопасности"
            text="Готовые спокойные тексты. Отправка пишет запись в историю (демо). Можно удалять старые, чтобы не забивать ленту."
          />
          <div className="grid gap-3 md:grid-cols-2">
            {SECURITY_TEMPLATES.map((t) => {
              const meta = SEVERITY_META[t.severity] || SEVERITY_META.info;
              return (
                <article
                  key={t.id}
                  className="flex flex-col border border-white/[0.08] p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span
                        className={`inline-flex rounded-md border px-2 py-0.5 font-mono text-[9px] uppercase ${meta.cls}`}
                      >
                        {meta.label}
                      </span>
                      <h3 className="mt-2 text-[14px] font-medium text-white">
                        {t.titleRu}
                      </h3>
                    </div>
                    <ShieldAlert size={16} className="text-[#60a5fa]" />
                  </div>
                  <p className="mt-2 flex-1 text-[12px] leading-relaxed text-[#9aa3ad]">
                    {t.bodyRu}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      sendSecurityNotice(t.id, "all");
                      pushAudit(who, `Sec-шаблон: ${t.titleRu}`);
                      setNote("Уведомление записано");
                    }}
                    className="mt-3 inline-flex items-center justify-center gap-1.5 rounded-xl border border-sky-400/30 bg-sky-500/10 px-3 py-2 text-[12px] font-medium text-sky-100"
                  >
                    <Send size={13} /> Отправить всем
                  </button>
                </article>
              );
            })}
          </div>
          <section className="border border-white/[0.08] p-4">
            <h2 className="text-[14px] font-semibold text-white">
              История отправок
            </h2>
            <ul className="mt-3 space-y-2">
              {securityNotices.map((n) => (
                <li
                  key={n.id}
                  className="flex flex-wrap items-start justify-between gap-2 rounded-xl border border-white/[0.06] px-3 py-2"
                >
                  <div>
                    <div className="text-[13px] text-white">{n.titleRu}</div>
                    <div className="text-[10px] text-[#64748b]">
                      {fmtTime(n.at)} · {n.target}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteSecurityNotice(n.id)}
                    className="text-rose-300"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}

      {tab === "sessions" ? (
        <div className="space-y-4">
          <Explain
            title="Сессии и вход"
            text="Кто сейчас в системе и с какого устройства. 2FA не подключена и вход не защищает вторым кодом."
          />
          <div className="grid gap-3 sm:grid-cols-3">
            <PolicyCard
              icon={Lock}
              title="2FA для админов"
              on={require2fa}
              onToggle={() =>
                setNote("2FA не подключена. Переключатель ничего не меняет на входе.")
              }
            />
            <PolicyCard
              icon={Smartphone}
              title="Уведомлять о новом устройстве"
              on
              onToggle={() =>
                pushAudit(who, "Политика устройств обновлена", "info")
              }
            />
            <PolicyCard
              icon={Globe}
              title="Алерт при смене страны"
              on
              onToggle={() =>
                pushAudit(who, "Гео-алерты обновлены", "info")
              }
            />
          </div>
          <section className="overflow-hidden border border-white/[0.08]">
            <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
              <Users size={14} className="text-[#60a5fa]" />
              <h2 className="text-[14px] font-semibold text-white">
                Активные сессии
              </h2>
            </div>
            <ul className="divide-y divide-white/[0.06]">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                >
                  <div>
                    <div className="text-[13px] text-white">
                      {s.who}
                      {s.current ? (
                        <span className="ml-2 rounded-md bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] text-emerald-300">
                          это вы
                        </span>
                      ) : null}
                    </div>
                    <div className="text-[11px] text-[#64748b]">
                      {s.device} · {s.geo} · {s.last}
                    </div>
                  </div>
                  {!s.current ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSessions((prev) =>
                          prev.filter((x) => x.id !== s.id)
                        );
                        pushAudit(who, `Сессия снята: ${s.who}`, "warn");
                      }}
                      className="rounded-lg border border-rose-400/30 px-2.5 py-1 text-[11px] text-rose-200"
                    >
                      Выгнать
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function LiveFeed({ feedRef, live, logs, flashId, levelCls }) {
  return (
    <aside className="flex max-h-[720px] flex-col overflow-hidden border-t border-white/[0.08] lg:border-l lg:border-t-0 lg:pl-5">
      <div className="flex items-center justify-between py-3">
        <div className="flex items-center gap-2">
          <Circle
            size={8}
            className={live ? "fill-white text-white" : "fill-[#57534e] text-[#57534e]"}
          />
          <span className="text-[11px] uppercase tracking-[0.14em] text-[#a8a29e]">
            Live security feed
          </span>
        </div>
        <TermHint text="Новые события появляются сверху, как в диспетчерской. Можно выключить кнопкой Live." />
      </div>
      <div
        ref={feedRef}
        className="eh-live-feed flex-1 space-y-1.5 overflow-y-auto p-2.5 font-mono text-[11px]"
      >
        {logs.slice(0, 40).map((row, i) => (
          <div
            key={row.id}
            className={[
              "eh-live-row border-b border-white/[0.06] py-2.5",
              levelCls(row.level),
              i === 0 && live ? "eh-live-pop" : "",
              flashId && i === 0 ? "ring-1 ring-emerald-300/50" : "",
            ].join(" ")}
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-[9px] opacity-70">{fmtTime(row.at)}</span>
              <span className="text-[9px] uppercase opacity-60">
                {row.level || "info"}
              </span>
            </div>
            <div className="mt-0.5 leading-snug text-white/95">{row.action}</div>
            <div className="mt-0.5 truncate text-[9px] opacity-50">{row.who}</div>
          </div>
        ))}
        {!logs.length ? (
          <p className="p-4 text-center text-[#64748b]">Лента пуста</p>
        ) : null}
      </div>
    </aside>
  );
}

function LogRow({ row, editing, onEdit, onCancel, onSave, onDelete, levelCls }) {
  return (
    <li
      className={`border-b border-white/[0.06] py-3 ${levelCls(row.level)}`}
    >
      {editing ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            className="eh-term-input flex-1 text-[12px]"
            defaultValue={row.action}
            id={`aud-${row.id}`}
          />
          <button
            type="button"
            className="eh-term-btn-ghost text-[11px]"
            onClick={() => {
              const el = document.getElementById(`aud-${row.id}`);
              onSave(el?.value?.trim() || row.action);
            }}
          >
            Сохранить
          </button>
          <button
            type="button"
            className="eh-term-btn-ghost text-[11px]"
            onClick={onCancel}
          >
            Отмена
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <span className="text-[12px] text-white">{row.action}</span>
            <div className="text-[10px] opacity-60">
              {row.who} · {fmtTime(row.at)}
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onEdit} className="opacity-70 hover:opacity-100">
              <Pencil size={12} />
            </button>
            <button type="button" onClick={onDelete} className="text-rose-200">
              <Trash2 size={12} />
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function Explain({ title, text }) {
  return (
    <div className="rounded-2xl border border-sky-400/20 bg-sky-500/[0.06] px-4 py-3">
      <div className="text-[13px] font-medium text-sky-50">{title}</div>
      <p className="mt-1 text-[12px] leading-relaxed text-sky-100/75">{text}</p>
    </div>
  );
}

function Stat({ icon: Icon, label, value, tip }) {
  return (
    <div className="border-t border-white/[0.08] pt-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[#78716c]">
        <Icon size={13} />
        {label}
        {tip ? <TermHint text={tip} /> : null}
      </div>
      <div className="eh-num mt-2 truncate text-[15px] text-white">
        {value}
      </div>
    </div>
  );
}

function Quick({ href, title, desc, tone }) {
  const cls = tone === "rose" ? "text-[#f0b4b4]" : "text-white";
  return (
    <a href={href} className="block border-b border-white/[0.06] py-3">
      <div className={`text-[13px] font-medium ${cls}`}>{title}</div>
      <div className="mt-0.5 text-[11px] text-[#9aa3ad]">{desc}</div>
    </a>
  );
}

function PolicyCard({ icon: Icon, title, on, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="border border-white/[0.08] p-4 text-left"
    >
      <div className="flex items-center justify-between gap-2">
        <Icon size={16} className="text-[#60a5fa]" />
        <span
          className={[
            "rounded-full px-2 py-0.5 font-mono text-[9px] uppercase",
            on
              ? "bg-emerald-500/15 text-emerald-300"
              : "bg-white/5 text-[#64748b]",
          ].join(" ")}
        >
          {on ? "on" : "off"}
        </span>
      </div>
      <div className="mt-2 text-[13px] font-medium text-white">{title}</div>
    </button>
  );
}

function SocFraudForms({ socForm, setSocForm, onAdd }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onAdd();
      }}
      className="grid gap-2 border border-white/[0.08] p-4 sm:grid-cols-4"
    >
      <input
        className="eh-term-input sm:col-span-2"
        placeholder="Что случилось"
        value={socForm.title}
        onChange={(e) => setSocForm((f) => ({ ...f, title: e.target.value }))}
      />
      <select
        className="eh-term-input"
        value={socForm.severity}
        onChange={(e) =>
          setSocForm((f) => ({ ...f, severity: e.target.value }))
        }
      >
        <option value="low">low</option>
        <option value="medium">medium</option>
        <option value="high">high</option>
      </select>
      <button
        type="submit"
        className="rounded-xl bg-[#2563eb] px-3 py-2 text-[12px] font-semibold text-white"
      >
        Добавить
      </button>
      <input
        className="eh-term-input sm:col-span-4"
        placeholder="Подробности простыми словами"
        value={socForm.detail}
        onChange={(e) => setSocForm((f) => ({ ...f, detail: e.target.value }))}
      />
    </form>
  );
}

function ScoreBadge({ score }) {
  const cls =
    score >= 75
      ? "text-rose-300"
      : score >= 50
        ? "text-amber-300"
        : "text-emerald-300";
  return <span className={`font-mono text-[12px] ${cls}`}>{score}</span>;
}

function fmtTime(at) {
  if (!at) return "-";
  try {
    return new Date(at).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch {
    return "-";
  }
}
