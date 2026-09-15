"use client";

/**
 * =============================================================================
 * SupportCenter — FAQ от А до Я + тикеты + чат с экспертом
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
import { getLotById, lotTitle } from "@/data/demoLots";
import { HERRAC_URL } from "@/lib/constants";
import { useTerminalPanel } from "@/context/TerminalPanelContext";
import { useLocale } from "@/lib/i18n/LocaleProvider";
import { getTerminalDict } from "@/lib/i18n/terminalDict";
import SupportChat from "@/components/admin/SupportChat";
import SectionGuide from "./SectionGuide";

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
  done: {
    icon: CheckCircle2,
    az: "Bağlı",
    ru: "Закрыт",
    cls: "text-emerald-300 bg-emerald-500/15",
  },
};

export default function SupportCenter() {
  const { locale } = useLocale();
  const t = getTerminalDict(locale);
  const { tickets, addTicket, setTicketStatus } = useTerminalPanel();
  const [tab, setTab] = useState("faq");
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
    if (cat === "all") return SUPPORT_FAQ;
    return SUPPORT_FAQ.filter(
      (f) => (locale === "az" ? f.catAz : f.catRu) === cat
    );
  }, [cat, locale]);

  const onCreate = (e) => {
    e.preventDefault();
    if (!form.title.trim() || !form.body.trim()) return;
    addTicket({
      topic: form.topic,
      lotId: form.lotId || null,
      titleAz: form.title.trim(),
      titleRu: form.title.trim(),
      bodyAz: form.body.trim(),
      bodyRu: form.body.trim(),
    });
    setForm({ topic: "lot", title: "", body: "", lotId: "" });
    setShowForm(false);
    setSent(true);
    setTab("tickets");
    setTimeout(() => setSent(false), 2500);
  };

  const tabs = [
    { id: "faq", label: t.supportTabFaq, icon: LifeBuoy },
    { id: "tickets", label: t.supportTabTickets, icon: Ticket },
    { id: "chat", label: t.supportTabChat, icon: MessageSquare },
  ];

  return (
    <div className="mx-auto max-w-[960px] space-y-5">
      <SectionGuide section="support" />

      <div>
        <h2 className="text-[22px] font-semibold tracking-tight text-white">
          {t.supportTitle}
        </h2>
        <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[#94a3b8]">
          {t.supportHintLong}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#2563eb]/30 bg-[#0d1524] px-4 py-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">
            {t.howHubRole}
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#94a3b8]">
            {t.howHubRoleText}
          </p>
        </div>
        <div className="rounded-2xl border border-amber-500/25 bg-[#16120a] px-4 py-3.5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-300">
            {t.howHerracRole}
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-[#94a3b8]">
            {t.howHerracRoleText}
          </p>
          <a
            href={HERRAC_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-amber-200 hover:text-white"
          >
            herrac.gov.az
            <ExternalLink size={12} />
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 rounded-2xl border border-white/10 bg-[#0a0c12] p-1.5">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={[
                "inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-[13px] font-medium transition sm:flex-none",
                active
                  ? "bg-[#2563eb] text-white shadow-[0_10px_24px_-12px_rgba(37,99,235,0.85)]"
                  : "text-[#94a3b8] hover:bg-white/[0.04] hover:text-white",
              ].join(" ")}
            >
              <Icon size={15} />
              {item.label}
              {item.id === "tickets" ? (
                <span className="rounded-md bg-white/10 px-1.5 py-0.5 font-mono text-[10px]">
                  {tickets.length}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

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
                  className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c12]"
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
              const lot = ticket.lotId ? getLotById(ticket.lotId) : null;
              const reply =
                locale === "az" ? ticket.replyAz : ticket.replyRu;
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
                          {ticket.createdAt}
                        </span>
                      </div>
                      <h3 className="mt-2 text-[15px] font-semibold text-white">
                        {locale === "az" ? ticket.titleAz : ticket.titleRu}
                      </h3>
                      {lot ? (
                        <p className="mt-1 text-[12px] text-[#64748b]">
                          {t.openLot}: {lotTitle(lot, locale)}
                        </p>
                      ) : null}
                    </div>
                    <select
                      className="eh-term-input w-auto py-1.5 text-[11px]"
                      value={ticket.status}
                      onChange={(e) =>
                        setTicketStatus(ticket.id, e.target.value)
                      }
                    >
                      <option value="open">
                        {locale === "az" ? "Açıq" : "Открыт"}
                      </option>
                      <option value="waiting">
                        {locale === "az" ? "Gözləyir" : "Ждёт"}
                      </option>
                      <option value="done">
                        {locale === "az" ? "Bağlı" : "Закрыт"}
                      </option>
                    </select>
                  </div>
                  <p className="mt-3 text-[13px] leading-relaxed text-[#94a3b8]">
                    {locale === "az" ? ticket.bodyAz : ticket.bodyRu}
                  </p>
                  {reply ? (
                    <div className="mt-3 rounded-xl border border-[#2563eb]/25 bg-[#0d1524] px-3 py-2.5">
                      <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#93c5fd]">
                        {t.supportReply}
                      </div>
                      <p className="mt-1 text-[13px] leading-relaxed text-[#cbd5e1]">
                        {reply}
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
          </div>
        </div>
      ) : null}

      {tab === "chat" ? (
        <div className="space-y-3">
          <p className="text-[13px] text-[#94a3b8]">{t.supportChatHint}</p>
          <SupportChat />
        </div>
      ) : null}
    </div>
  );
}
