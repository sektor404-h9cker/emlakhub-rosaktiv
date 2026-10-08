"use client";

/**
 * SupportChat - тикет-система L1/L2 с шаблонами, медиа, историей
 */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  LifeBuoy,
  Paperclip,
  Send,
  Lock,
  LockOpen,
  ArrowUpRight,
  Trash2,
  Pencil,
  Image as ImageIcon,
  ShieldAlert,
} from "lucide-react";
import { useSupportDesk } from "@/hooks/useSupportDesk";
import {
  getSupportTemplates,
  getSupportLevelMeta,
} from "@/lib/supportTemplates";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";
import {
  getFraudScenario,
  scenarioCopy,
} from "@/lib/fraudIntel";

const STATUS_FILTERS = {
  az: [
    { id: "all", label: "Hamısı" },
    { id: "open", label: "Açıq" },
    { id: "waiting", label: "Gözləyir" },
    { id: "closed", label: "Bağlı" },
  ],
  ru: [
    { id: "all", label: "Все" },
    { id: "open", label: "Открытые" },
    { id: "waiting", label: "Ждут" },
    { id: "closed", label: "Закрытые" },
  ],
  en: [
    { id: "all", label: "All" },
    { id: "open", label: "Open" },
    { id: "waiting", label: "Waiting" },
    { id: "closed", label: "Closed" },
  ],
};

export default function SupportChat() {
  const { locale } = useAdminI18n();
  const {
    tickets,
    loading,
    error,
    sendMessage,
    setStatus,
    setLevel,
    editMessage,
    removeMessage,
    removeTicket,
  } = useSupportDesk();
  const [sendError, setSendError] = useState("");

  const [filter, setFilter] = useState("all");
  const [levelFilter, setLevelFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [activeId, setActiveId] = useState("");
  const [text, setText] = useState("");
  const [mediaPreview, setMediaPreview] = useState(null);
  const [showTemplates, setShowTemplates] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");
  const fileRef = useRef(null);
  const bottomRef = useRef(null);

  const statusFilters = STATUS_FILTERS[locale] || STATUS_FILTERS.ru;

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (levelFilter !== "all" && t.level !== levelFilter) return false;
      if (sourceFilter === "fraud" && t.source !== "fraud_intel") return false;
      return true;
    });
  }, [tickets, filter, levelFilter, sourceFilter]);

  const resolvedId = tickets.some((t) => t.id === activeId)
    ? activeId
    : filtered[0]?.id || "";
  const ticket = tickets.find((t) => t.id === resolvedId) || null;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages?.length, activeId]);

  const templates = useMemo(
    () => getSupportTemplates(locale, ticket?.level),
    [ticket?.level, locale]
  );

  const levelMeta = ticket
    ? getSupportLevelMeta(ticket.level, locale)
    : null;

  const onPickFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview({
        name: file.name,
        type: file.type,
        dataUrl: reader.result,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const send = async (overrideText) => {
    const body = (overrideText ?? text).trim();
    if ((!body && !mediaPreview) || !ticket) return;
    setSendError("");
    try {
      await sendMessage(ticket.id, {
        body: body || "Вложение",
        attachment: mediaPreview
          ? {
              name: mediaPreview.name,
              type: mediaPreview.type,
              dataUrl: mediaPreview.dataUrl,
            }
          : null,
      });
      setText("");
      setMediaPreview(null);
      setShowTemplates(false);
    } catch (e) {
      setSendError(e.message || "Не удалось отправить сообщение.");
    }
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#b8956c]">
            Admin · support
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
            <LifeBuoy size={22} className="text-[#d4a574]" />
            Тикет-система
          </h1>
            <p className="mt-1 text-[13px] text-[#9aa3ad]">
            Сообщения инвесторов приходят сюда. Ответ увидит автор обращения.
          </p>
          {error ? (
            <p className="mt-2 text-[13px] text-amber-200">{error}</p>
          ) : null}
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {statusFilters.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={[
              "rounded-xl px-3 py-1.5 text-[12px]",
              filter === f.id
                ? "bg-white/10 text-white"
                : "text-[#9aa3ad] hover:text-white",
            ].join(" ")}
          >
            {f.label}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-white/10" />
        {["all", "L1", "L2"].map((lv) => (
          <button
            key={lv}
            type="button"
            onClick={() => setLevelFilter(lv)}
            className={[
              "rounded-xl px-3 py-1.5 text-[12px]",
              levelFilter === lv
                ? "bg-[#b8956c]/20 text-[#e8d5b0]"
                : "text-[#9aa3ad]",
            ].join(" ")}
          >
            {lv === "all"
              ? locale === "az"
                ? "Bütün səviyyələr"
                : locale === "en"
                  ? "All levels"
                  : "Все уровни"
              : getSupportLevelMeta(lv, locale).label}
          </button>
        ))}
        <span className="mx-1 h-6 w-px bg-white/10" />
        <button
          type="button"
          onClick={() =>
            setSourceFilter((v) => (v === "fraud" ? "all" : "fraud"))
          }
          className={[
            "inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-[12px]",
            sourceFilter === "fraud"
              ? "bg-rose-500/20 text-rose-100"
              : "text-[#9aa3ad]",
          ].join(" ")}
        >
          <ShieldAlert size={12} />
          Антифрод
        </button>
      </div>

      <div className="grid min-h-[520px] gap-3 lg:grid-cols-[280px_1fr]">
        <aside className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c12]">
          <div className="max-h-[70vh] space-y-1 overflow-y-auto p-2">
            {filtered.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveId(t.id)}
                className={[
                  "w-full rounded-xl px-3 py-2.5 text-left transition",
                  activeId === t.id || resolvedId === t.id
                    ? "bg-white/[0.07] ring-1 ring-white/10"
                    : "hover:bg-white/[0.03]",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] text-[#64748b]">
                    {t.id} · {t.level}
                  </span>
                  <div className="flex items-center gap-1">
                    {t.source === "fraud_intel" ? (
                      <span className="rounded bg-rose-500/20 px-1.5 py-0.5 text-[9px] text-rose-200">
                        fraud
                      </span>
                    ) : null}
                    <StatusPill status={t.status} />
                  </div>
                </div>
                <div className="mt-0.5 truncate text-[13px] text-white">
                  {t.subject}
                </div>
                <div className="truncate text-[11px] text-[#6b7280]">
                  {t.userName} · {t.userEmail}
                </div>
              </button>
            ))}
            {!filtered.length ? (
              <p className="p-4 text-center text-[12px] text-[#64748b]">
                {loading ? "Загрузка…" : "Пока нет обращений"}
              </p>
            ) : null}
          </div>
        </aside>

        <section className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c12]">
          {!ticket ? (
            <div className="flex flex-1 items-center justify-center text-[13px] text-[#64748b]">
              Выберите тикет
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-white/10 px-4 py-3">
                <div>
                  <h2 className="text-[15px] font-medium text-white">
                    {ticket.subject}
                  </h2>
                  <p className="text-[11px] text-[#6b7280]">
                    {ticket.userName} · {ticket.userEmail}
                    {ticket.fraudId ? ` · ${ticket.fraudId}` : ""}
                  </p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <select
                    className="eh-term-input py-1.5 text-[11px]"
                    value={ticket.level}
                    onChange={(e) => setLevel(ticket.id, e.target.value)}
                  >
                    <option value="L1">L1</option>
                    <option value="L2">L2</option>
                  </select>
                  {ticket.status === "closed" ? (
                    <button
                      type="button"
                      onClick={() => setStatus(ticket.id, "open")}
                      className="inline-flex items-center gap-1 rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] text-emerald-100"
                    >
                      <LockOpen size={12} /> Открыть
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setStatus(ticket.id, "closed")}
                      className="inline-flex items-center gap-1 rounded-xl border border-white/10 px-3 py-1.5 text-[11px] text-[#9aa3ad]"
                    >
                      <Lock size={12} /> Закрыть
                    </button>
                  )}
                  {ticket.level === "L1" ? (
                    <button
                      type="button"
                      onClick={() => setLevel(ticket.id, "L2")}
                      className="inline-flex items-center gap-1 rounded-xl border border-amber-400/30 bg-amber-500/10 px-3 py-1.5 text-[11px] text-amber-100"
                    >
                      <ArrowUpRight size={12} /> В L2
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      removeTicket(ticket.id);
                      setActiveId("");
                    }}
                    className="rounded-xl p-1.5 text-rose-300"
                    title="Удалить тикет"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {ticket.source === "fraud_intel" && ticket.scenarioId ? (
                <div className="border-b border-rose-400/20 bg-rose-500/[0.07] px-4 py-3">
                  <div className="flex items-start gap-2">
                    <ShieldAlert size={16} className="mt-0.5 text-rose-300" />
                    <div>
                      <div className="text-[12px] font-medium text-rose-100">
                        Автосигнал антифрода ·{" "}
                        {
                          scenarioCopy(
                            getFraudScenario(ticket.scenarioId),
                            locale
                          ).title
                        }
                      </div>
                      <p className="mt-1 text-[11px] leading-relaxed text-rose-100/75">
                        {
                          scenarioCopy(
                            getFraudScenario(ticket.scenarioId),
                            locale
                          ).explain
                        }
                      </p>
                      <p className="mt-1 text-[10px] text-rose-200/60">
                        Черновик ответа уже в ленте (suggested). Можно править
                        и отправить.
                      </p>
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex-1 space-y-3 overflow-y-auto p-4">
                {(ticket.messages || []).map((m) => {
                  const mine = m.from === "agent";
                  const system = m.from === "system";
                  return (
                    <div
                      key={m.id}
                      className={[
                        "max-w-[90%] rounded-2xl px-3.5 py-2.5 text-[13px] sm:max-w-[75%]",
                        system
                          ? "mx-auto max-w-full border border-rose-400/20 bg-rose-500/10 text-rose-50"
                          : mine
                            ? "ml-auto bg-[#b8956c]/15 text-[#e8d5b0]"
                            : "bg-white/[0.05] text-[#e8eaed]",
                      ].join(" ")}
                    >
                      <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#6b7280]">
                        {system
                          ? "system · antifraud"
                          : mine
                            ? `agent · ${m.level || ticket.level}${m.suggested ? " · draft" : ""}`
                            : "client"}
                        {m.at
                          ? ` · ${new Date(m.at).toLocaleString("ru-RU", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "short",
                            })}`
                          : ""}
                      </div>
                      {editingId === m.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="eh-term-input min-h-[70px] text-[13px]"
                          />
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="eh-term-btn-ghost text-[11px]"
                              onClick={() => {
                                editMessage(ticket.id, m.id, editText.trim()).then(
                                  () => setEditingId(null),
                                  (e) => setSendError(e.message || "Не удалось сохранить.")
                                );
                              }}
                            >
                              Сохранить
                            </button>
                            <button
                              type="button"
                              className="eh-term-btn-ghost text-[11px]"
                              onClick={() => setEditingId(null)}
                            >
                              Отмена
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="whitespace-pre-wrap leading-relaxed">
                            {m.text}
                          </p>
                          {m.media?.dataUrl ? (
                            <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
                              {m.media.type?.startsWith("image/") ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={m.media.dataUrl}
                                  alt={m.media.name || "media"}
                                  className="max-h-48 w-full object-cover"
                                />
                              ) : (
                                <a
                                  href={m.media.dataUrl}
                                  download={m.media.name}
                                  className="flex items-center gap-2 px-3 py-2 text-[11px] text-[#93c5fd]"
                                >
                                  <Paperclip size={12} />
                                  {m.media.name || "Файл"}
                                </a>
                              )}
                            </div>
                          ) : null}
                          {mine ? (
                            <div className="mt-2 flex gap-2">
                              <button
                                type="button"
                                className="font-mono text-[9px] text-[#6b7280] hover:text-[#b8956c]"
                                onClick={() => {
                                  setEditingId(m.id);
                                  setEditText(m.text || "");
                                }}
                              >
                                <Pencil size={10} className="inline" /> edit
                              </button>
                              <button
                                type="button"
                                className="font-mono text-[9px] text-[#6b7280] hover:text-red-400"
                                onClick={() =>
                                  removeMessage(ticket.id, m.id).catch((e) =>
                                    setSendError(e.message || "Не удалось удалить.")
                                  )
                                }
                              >
                                delete
                              </button>
                            </div>
                          ) : null}
                        </>
                      )}
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {ticket.status === "closed" ? (
                <div className="border-t border-white/10 px-4 py-3 text-center text-[12px] text-[#64748b]">
                  Тикет закрыт. Откройте снова, чтобы ответить.
                </div>
              ) : (
                <div className="border-t border-white/10 p-3">
                  {showTemplates ? (
                    <div className="mb-3 space-y-2">
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#64748b]">
                        {locale === "az"
                          ? `Şablonlar · dil ${locale.toUpperCase()}`
                          : locale === "en"
                            ? `Templates · lang ${locale.toUpperCase()}`
                            : `Шаблоны · язык ${locale.toUpperCase()}`}
                        {levelMeta ? ` · ${levelMeta.label}` : ""}
                      </p>
                      <div className="grid max-h-44 gap-1.5 overflow-y-auto sm:grid-cols-2">
                        {templates.map((tpl) => (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => send(tpl.text)}
                            className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-left text-[11px] text-[#c4c8ce] hover:border-[#b8956c]/40"
                          >
                            <span className="font-medium text-[#e8d5b0]">
                              {tpl.title}
                            </span>
                            <span className="mt-0.5 line-clamp-2 block text-[#6b7280]">
                              {tpl.text}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {mediaPreview ? (
                    <div className="mb-2 flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-[11px] text-[#9aa3ad]">
                      <ImageIcon size={14} />
                      <span className="truncate">{mediaPreview.name}</span>
                      <button
                        type="button"
                        className="ml-auto text-rose-300"
                        onClick={() => setMediaPreview(null)}
                      >
                        убрать
                      </button>
                    </div>
                  ) : null}
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setShowTemplates((v) => !v)}
                      className="eh-term-btn-ghost text-[11px]"
                    >
                      {locale === "az"
                        ? `Şablonlar ${ticket.level}`
                        : locale === "en"
                          ? `Templates ${ticket.level}`
                          : `Шаблоны ${ticket.level}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="eh-term-btn-ghost text-[11px]"
                    >
                      <Paperclip size={12} className="mr-1 inline" />
                      Медиа
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,.pdf,.doc,.docx"
                      className="hidden"
                      onChange={onPickFile}
                    />
                  </div>
                  {sendError ? (
                    <p className="mb-2 text-[12px] text-amber-200">{sendError}</p>
                  ) : null}
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      send();
                    }}
                  >
                    <input
                      value={text}
                      onChange={(e) => setText(e.target.value)}
                      placeholder="Эмпатичный ответ клиенту…"
                      className="eh-term-input flex-1 text-[13px]"
                    />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1.5 rounded-xl bg-[#b8956c] px-4 py-2.5 text-[13px] font-semibold text-[#1a1208]"
                    >
                      <Send size={14} />
                    </button>
                  </form>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const map = {
    open: "bg-sky-500/15 text-sky-300",
    waiting: "bg-amber-500/15 text-amber-300",
    closed: "bg-emerald-500/15 text-emerald-300",
  };
  return (
    <span
      className={`rounded-md px-1.5 py-0.5 font-mono text-[9px] uppercase ${map[status] || "text-[#64748b]"}`}
    >
      {status}
    </span>
  );
}
