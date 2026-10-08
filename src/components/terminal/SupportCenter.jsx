"use client";

/**
 * =============================================================================
 * SupportCenter - FAQ от А до Я + тикеты + чат с экспертом
 * =============================================================================
 */

import { useMemo, useState } from "react";
import {
  ChevronDown,
  LifeBuoy,
  MessageSquare,
  Plus,
  Ticket,
  CheckCircle2,
  Clock3,
  CircleDot,
  ExternalLink,
} from "lucide-react";
import { SUPPORT_FAQ } from "@/data/demoPanel";
import { say } from "@/lib/i18n/copy";
import { HERRAC_URL } from "@/lib/constants";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import { useSupportDesk } from "@/hooks/useSupportDesk";

const TOPICS = [
  { id: "legal", az: "Hüquq", ru: "Юридика" },
  { id: "deposit", az: "Beh / ödəniş", ru: "Задаток / оплата" },
  { id: "lot", az: "Lot / analiz", ru: "Лот / анализ" },
  { id: "access", az: "Giriş / hesab", ru: "Вход / аккаунт" },
  { id: "other", az: "Digər", ru: "Другое" },
];

const STATUS_META = {
  open: { icon: CircleDot, az: "Açıq", ru: "Открыт", cls: "text-sky-300 bg-sky-500/15" },
  waiting: {
    icon: Clock3,
    az: "Cavab gözləyir",
    ru: "Ждёт ответа",
    cls: "text-amber-300 bg-amber-500/15",
  },
  closed: {
    icon: CheckCircle2,
    az: "Bağlı",
    ru: "Закрыт",
    cls: "text-emerald-300 bg-emerald-500/15",
  },
};

export default function SupportCenter() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const {
    tickets,
    loading,
    error,
    createTicket,
    sendMessage,
    setStatus,
  } = useSupportDesk();
  const [activeId, setActiveId] = useState("");
  const [reply, setReply] = useState("");
  const [formError, setFormError] = useState("");
  const [tab, setTab] = useState("home");
  const [query, setQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(SUPPORT_FAQ[0]?.id || null);
  const [cat, setCat] = useState("all");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    topic: "lot",
    title: "",
    body: "",
    lotId: "",
  });
  const [sent, setSent] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(
      SUPPORT_FAQ.map((f) => (locale === "az" ? f.catAz : f.catRu))
    );
    return ["all", ...set];
  }, [locale]);

  const filteredFaq = useMemo(() => {
    const base =
      cat === "all"
        ? SUPPORT_FAQ
        : SUPPORT_FAQ.filter((f) => (locale === "az" ? f.catAz : f.catRu) === cat);
    const needle = query.trim().toLocaleLowerCase("ru");
    if (!needle) return base;
    return base.filter((item) =>
      `${item.qRu} ${item.qAz} ${item.aRu} ${item.aAz}`.toLocaleLowerCase("ru").includes(needle)
    );
  }, [cat, locale, query]);

  const onCreate = async (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    setFormError("");
    try {
      const ticket = await createTicket({
        topic: form.topic,
        lotId: form.lotId || null,
        subject: form.title.trim(),
        body: form.body.trim(),
      });
      setForm({ topic: "lot", title: "", body: "", lotId: "" });
      setShowForm(false);
      setSent(true);
      setActiveId(ticket?.id || "");
      setTab("chat");
      setTimeout(() => setSent(false), 2500);
    } catch (err) {
      setFormError(err.message || "Не удалось отправить сообщение.");
    }
  };

  const onReply = async (e) => {
    e.preventDefault();
    const body = reply.trim();
    const id = activeId || tickets[0]?.id;
    if (!body || !id) return;
    setFormError("");
    try {
      await sendMessage(id, { body });
      setReply("");
    } catch (err) {
      setFormError(err.message || "Не удалось отправить сообщение.");
    }
  };

  const tabs = [
    { id: "faq", label: t.supportTabFaq, icon: LifeBuoy },
    { id: "tickets", label: t.supportTabTickets, icon: Ticket },
    { id: "chat", label: t.supportTabChat, icon: MessageSquare },
  ];

  return (
    <div className="mx-auto max-w-[880px]">
      {tab === "home" ? (
        <div className="eh-fade-in">
          <h2 className="text-[32px] font-semibold tracking-tight text-white sm:text-[40px]">
            {say(locale, "Nə ilə kömək edək?", "Чем можем помочь?", "How can we help?")}
          </h2>
          <form
            className="mt-6"
            onSubmit={(event) => {
              event.preventDefault();
              setTab("faq");
            }}
          >
            <input
              className="eh-term-input text-[16px]"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={say(
                locale,
                "Sualı yazın və ya cavab axtarın…",
                "Опишите вопрос или найдите ответ…",
                "Type a question or search for an answer…"
              )}
            />
          </form>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {tabs.map((item) => {
              const Icon = item.icon;
              const hint =
                item.id === "faq"
                  ? say(locale, "Qısa cavablar və təlimatlar.", "Быстрые ответы и инструкции.", "Short answers and guides.")
                  : item.id === "tickets"
                    ? say(locale, "Cari sorğuların statusu.", "Статусы текущих запросов.", "Status of your current requests.")
                    : say(locale, "Komanda ilə canlı dialoq.", "Живой диалог с командой.", "A live conversation with the team.");
              const title =
                item.id === "faq"
                  ? say(locale, "Bilik bazası", "База знаний", "Knowledge base")
                  : item.id === "tickets"
                    ? say(locale, "Müraciətlərim", "Мои обращения", "My requests")
                    : say(locale, "Dəstəyə yazın", "Написать в поддержку", "Write to support");
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className="eh-press border-t border-white/[0.08] pt-4 text-left transition hover:bg-white/[0.02]"
                >
                  <Icon size={18} strokeWidth={1.6} className="text-[#d6d3d1]" />
                  <div className="mt-3 text-[16px] font-medium text-white">{title}</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-[#a8a29e]">{hint}</p>
                </button>
              );
            })}
          </div>
          <p className="mt-10 max-w-xl text-[13px] leading-relaxed text-[#a8a29e]">
            {say(
              locale,
              "Emlak Hub analiz edir. İştirak və təklif rəsmi Hərrac meydançasındadır.",
              "Emlak Hub анализирует. Участие и ставка — на официальной площадке Hərrac.",
              "Emlak Hub analyses. Taking part and bidding stay on the official Hərrac site."
            )}{" "}
            <a href={HERRAC_URL} target="_blank" rel="noopener noreferrer" className="text-[#93c5fd] hover:text-white">
              herrac.gov.az
              <ExternalLink size={12} className="ml-1 inline" />
            </a>
          </p>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setTab("home")}
          className="mb-6 text-[13px] text-[#93c5fd] hover:text-white"
        >
          ← {say(locale, "Dəstək mərkəzi", "Центр поддержки", "Support centre")}
        </button>
      )}

      {tab === "faq" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCat(c)}
                className={[
                  "rounded-full border px-3 py-1.5 text-[12px] transition",
                  cat === c
                    ? "border-[#2563eb]/50 bg-[#2563eb]/15 text-white"
                    : "border-white/10 text-[#94a3b8] hover:text-white",
                ].join(" ")}
              >
                {c === "all" ? t.supportFaqAll : c}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {filteredFaq.map((item) => {
              const open = openFaq === item.id;
              return (
                <div
                  key={item.id}
                  className="border-b border-white/[0.06]"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(open ? null : item.id)}
                    className="flex w-full items-start justify-between gap-3 px-4 py-3.5 text-left"
                  >
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                        {locale === "az" ? item.catAz : item.catRu}
                      </div>
                      <div className="mt-1 text-[14px] font-medium text-white">
                        {locale === "az" ? item.qAz : item.qRu}
                      </div>
                    </div>
                    <ChevronDown
                      size={16}
                      className={[
                        "mt-1 shrink-0 text-[#64748b] transition",
                        open ? "rotate-180 text-white" : "",
                      ].join(" ")}
                    />
                  </button>
                  {open ? (
                    <div className="border-t border-white/[0.06] px-4 py-3.5 text-[13px] leading-relaxed text-[#94a3b8]">
                      {locale === "az" ? item.aAz : item.aRu}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-4 text-[13px] text-[#94a3b8]">
            {t.supportFaqFooter}{" "}
            <button
              type="button"
              onClick={() => {
                setTab("tickets");
                setShowForm(true);
              }}
              className="font-medium text-[#60a5fa] hover:text-white"
            >
              {t.supportOpenTicket}
            </button>
          </div>
        </div>
      ) : null}

      {tab === "tickets" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-[#94a3b8]">{t.supportTicketsHint}</p>
            <button
              type="button"
              onClick={() => setShowForm((v) => !v)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-3.5 py-2 text-[13px] font-semibold text-white"
            >
              <Plus size={15} />
              {t.supportNewTicket}
            </button>
          </div>

          {error || formError ? (
            <div className="rounded-xl border border-amber-400/30 bg-amber-500/10 px-4 py-3 text-[13px] text-amber-100">
              {formError || error}
            </div>
          ) : null}

          {sent ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-[13px] text-emerald-300">
              {t.supportTicketSent}
            </div>
          ) : null}

          {showForm ? (
            <form
              onSubmit={onCreate}
              className="space-y-3 rounded-2xl border border-white/10 bg-[#0a0c12] p-4"
            >
              <div className="text-[13px] font-semibold text-white">
                {t.supportNewTicket}
              </div>
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-[#64748b]">
                  {t.supportTopic}
                </span>
                <select
                  className="eh-term-input"
                  value={form.topic}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, topic: e.target.value }))
                  }
                >
                  {TOPICS.map((topic) => (
                    <option key={topic.id} value={topic.id}>
                      {locale === "az" ? topic.az : topic.ru}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-[#64748b]">
                  {t.supportLotOptional}
                </span>
                <input
                  className="eh-term-input"
                  value={form.lotId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, lotId: e.target.value }))
                  }
                  placeholder="EST-NAR-3"
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-[#64748b]">
                  {t.supportSubject}
                </span>
                <input
                  className="eh-term-input"
                  required
                  value={form.title}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, title: e.target.value }))
                  }
                  placeholder={t.supportSubjectPh}
                />
              </label>
              <label className="block">
                <span className="mb-1 block text-[11px] uppercase tracking-[0.14em] text-[#64748b]">
                  {t.supportBody}
                </span>
                <textarea
                  className="eh-term-input min-h-[110px] resize-y"
                  required
                  value={form.body}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, body: e.target.value }))
                  }
                  placeholder={t.supportBodyPh}
                />
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-[#2563eb] px-4 py-2.5 text-[13px] font-semibold text-white"
                >
                  {t.supportSend}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-[13px] text-[#94a3b8]"
                >
                  {t.menuClose}
                </button>
              </div>
            </form>
          ) : null}

          <div className="space-y-3">
            {tickets.map((ticket) => {
              const meta = STATUS_META[ticket.status] || STATUS_META.open;
              const StatusIcon = meta.icon;
              const answer = [...(ticket.messages || [])]
                .reverse()
                .find((m) => m.from === "agent");
              return (
                <article
                  key={ticket.id}
                  className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[11px] text-[#93c5fd]">
                          {ticket.id}
                        </span>
                        <span
                          className={[
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                            meta.cls,
                          ].join(" ")}
                        >
                          <StatusIcon size={11} />
                          {locale === "az" ? meta.az : meta.ru}
                        </span>
                        <span className="text-[11px] text-[#64748b]">
                          {ticket.createdAt
                            ? new Date(ticket.createdAt).toLocaleString(
                                locale === "az" ? "az-AZ" : "ru-RU",
                                { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }
                              )
                            : ""}
                        </span>
                      </div>
                      <h3 className="mt-2 text-[15px] font-semibold text-white">
                        {locale === "az" ? ticket.titleAz : ticket.titleRu}
                      </h3>
                      {ticket.lotId ? (
                        <p className="mt-1 text-[12px] text-[#64748b]">
                          {t.openLot}: {ticket.lotId}
                        </p>
                      ) : null}
                    </div>
                    <select
                      className="eh-term-input w-auto py-1.5 text-[11px]"
                      value={ticket.status}
                      onChange={(e) => setStatus(ticket.id, e.target.value)}
                    >
                      <option value="open">
                        {say(locale, "Açıq", "Открыт", "Open")}
                      </option>
                      <option value="waiting">
                        {say(locale, "Gözləyir", "Ждёт", "Waiting")}
                      </option>
                      <option value="closed">
                        {say(locale, "Bağlı", "Закрыт", "Closed")}
                      </option>
                    </select>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-[#94a3b8]">
                    {locale === "az" ? ticket.bodyAz : ticket.bodyRu}
                  </p>
                  {answer ? (
                    <div className="mt-3 rounded-xl border border-[#2563eb]/25 bg-[#0d1524] px-3 py-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">
                        {t.supportReply}
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#cbd5e1]">
                        {answer.text}
                      </p>
                    </div>
                  ) : (
                    <p className="mt-3 text-[12px] text-[#64748b]">
                      {t.supportWaiting}
                    </p>
                  )}
                </article>
              );
            })}
            {!tickets.length && !loading ? (
              <p className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-[13px] text-[#64748b]">
                {locale === "az"
                  ? "Hələ müraciət yoxdur."
                  : "Обращений пока нет."}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === "chat" ? (
        <SupportThread
          tickets={tickets}
          loading={loading}
          activeId={activeId}
          setActiveId={setActiveId}
          reply={reply}
          setReply={setReply}
          onReply={onReply}
          formError={formError}
          locale={locale}
          t={t}
        />
      ) : null}
    </div>
  );
}

function SupportThread({
  tickets,
  loading,
  activeId,
  setActiveId,
  reply,
  setReply,
  onReply,
  formError,
  locale,
  t,
}) {
  const current =
    tickets.find((ticket) => ticket.id === activeId) || tickets[0] || null;

  if (loading && !tickets.length) {
    return <p className="text-[13px] text-[#64748b]">…</p>;
  }
  if (!current) {
    return (
      <div className="eh-fade-in max-w-md py-6">
        <p className="text-[22px] font-semibold text-white">
          {say(locale, "Dialoq hələ boşdur", "Диалог ещё пуст", "The conversation is still empty")}
        </p>
        <p className="mt-2 text-[14px] leading-relaxed text-[#a8a29e]">
          {locale === "az"
            ? "Müraciət yaradın — cavab burada, tarix və statusla görünəcək."
            : "Создайте обращение — ответ появится здесь, со временем и статусом."}
        </p>
        <p className="mt-4 text-[13px] text-[#78716c]">
          {locale === "az"
            ? "Emlak Hub analiz edir. Təklif Hərrac-dadır."
            : "Emlak Hub анализирует. Ставка остаётся на Hərrac."}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 lg:grid-cols-[240px_1fr]">
      <aside className="space-y-1">
        {tickets.map((ticket) => (
          <button
            key={ticket.id}
            type="button"
            onClick={() => setActiveId(ticket.id)}
            className={[
              "w-full rounded-xl border px-3 py-2 text-left",
              current.id === ticket.id
                ? "border-[#2563eb]/40 bg-[#2563eb]/10"
                : "border-white/10",
            ].join(" ")}
          >
            <div className="truncate text-[13px] text-white">{ticket.subject}</div>
            <div className="text-[11px] text-[#64748b]">{ticket.status}</div>
          </button>
        ))}
      </aside>
      <section className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
        <h3 className="text-[15px] font-semibold text-white">{current.subject}</h3>
        <div className="mt-4 space-y-2">
          {(current.messages || []).map((message) => {
            const mine = message.from !== "agent";
            return (
              <div
                key={message.id}
                className={[
                  "eh-fade-in max-w-[85%] px-1 py-2 text-[14px]",
                  mine ? "ml-auto text-right" : "text-left",
                ].join(" ")}
              >
                <div className="mb-1 text-[11px] text-[#78716c]">
                  {mine ? say(locale, "Siz", "Вы", "You") : t.supportReply}
                  {message.createdAt
                    ? ` · ${new Date(message.createdAt).toLocaleString(locale === "az" ? "az" : locale === "en" ? "en-GB" : "ru", { hour: "2-digit", minute: "2-digit", day: "numeric", month: "short" })}`
                    : ""}
                </div>
                <p className="whitespace-pre-wrap leading-relaxed text-[#f5f5f4]">{message.text}</p>
              </div>
            );
          })}
        </div>
        {formError ? (
          <p className="mt-3 text-[12px] text-amber-200">{formError}</p>
        ) : null}
        {current.status === "closed" ? (
          <p className="mt-4 text-[12px] text-[#64748b]">
            {locale === "az"
              ? "Müraciət bağlıdır."
              : "Обращение закрыто."}
          </p>
        ) : (
          <form onSubmit={onReply} className="mt-4 flex gap-2">
            <input
              className="eh-term-input flex-1"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={t.supportBodyPh}
            />
            <button
              type="submit"
              className="rounded-xl bg-[#2563eb] px-4 py-2 text-[13px] font-semibold text-white"
            >
              {t.supportSend}
            </button>
          </form>
        )}
      </section>
    </div>
  );
}
