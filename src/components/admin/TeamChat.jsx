"use client";

/**
 * TeamChat - чаты команды + общая группа
 */

import { useMemo, useRef, useState } from "react";
import { MessagesSquare, Plus, Send, Trash2, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSystem } from "@/context/SystemContext";

export default function TeamChat() {
  const { profile } = useAuth();
  const {
    teamChannels,
    sendTeamMessage,
    createTeamChannel,
    deleteTeamChannel,
    users,
    pushAudit,
  } = useSystem();
  const [activeId, setActiveId] = useState(teamChannels[0]?.id || "");
  const [text, setText] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [newCh, setNewCh] = useState({
    name: "",
    type: "group",
    desc: "",
  });
  const bottomRef = useRef(null);

  const channel =
    teamChannels.find((c) => c.id === activeId) || teamChannels[0] || null;

  const staff = useMemo(
    () => users.filter((u) => u.role !== "investor"),
    [users]
  );

  const send = (e) => {
    e?.preventDefault?.();
    const t = text.trim();
    if (!t || !channel) return;
    sendTeamMessage(channel.id, {
      from: profile?.email || "admin",
      name: profile?.displayName || profile?.email || "Admin",
      text: t,
    });
    setText("");
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-4 pb-8">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#93c5fd]">
            Admin · team
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
            <MessagesSquare size={22} className="text-[#60a5fa]" />
            Чат команды
          </h1>
          <p className="mt-1 text-[13px] text-[#9aa3ad]">
            Общая группа, каналы отделов и личные диалоги.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowNew((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563eb] px-4 py-2.5 text-[13px] font-semibold text-white"
        >
          <Plus size={14} /> Канал
        </button>
      </header>

      {showNew ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newCh.name.trim()) return;
            const id = createTeamChannel(newCh);
            pushAudit(profile?.email, `Создан канал ${newCh.name}`);
            setActiveId(id);
            setNewCh({ name: "", type: "group", desc: "" });
            setShowNew(false);
          }}
          className="grid gap-2 rounded-2xl border border-sky-400/25 bg-sky-500/[0.05] p-4 sm:grid-cols-4"
        >
          <input
            className="eh-term-input sm:col-span-2"
            placeholder="Название"
            value={newCh.name}
            onChange={(e) => setNewCh((f) => ({ ...f, name: e.target.value }))}
          />
          <select
            className="eh-term-input"
            value={newCh.type}
            onChange={(e) => setNewCh((f) => ({ ...f, type: e.target.value }))}
          >
            <option value="group">Группа</option>
            <option value="dept">Отдел</option>
            <option value="dm">Личный</option>
          </select>
          <button
            type="submit"
            className="rounded-xl bg-[#2563eb] text-[12px] font-semibold text-white"
          >
            Создать
          </button>
        </form>
      ) : null}

      <div className="grid min-h-[520px] gap-3 lg:grid-cols-[260px_1fr]">
        <aside className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c12]">
          <div className="border-b border-white/10 px-3 py-2.5 text-[11px] uppercase tracking-[0.14em] text-[#64748b]">
            Каналы · {teamChannels.length}
          </div>
          <div className="max-h-[70vh] space-y-1 overflow-y-auto p-2">
            {teamChannels.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveId(ch.id)}
                className={[
                  "w-full rounded-xl px-3 py-2.5 text-left transition",
                  (channel?.id || activeId) === ch.id
                    ? "bg-white/[0.07] ring-1 ring-white/10"
                    : "hover:bg-white/[0.03]",
                ].join(" ")}
              >
                <div className="flex items-center gap-2">
                  <Users size={12} className="text-[#60a5fa]" />
                  <span className="truncate text-[13px] text-white">
                    {ch.name}
                  </span>
                </div>
                <div className="mt-0.5 truncate font-mono text-[9px] text-[#64748b]">
                  {ch.type} · {ch.messages?.length || 0} msg
                </div>
              </button>
            ))}
          </div>
          <div className="border-t border-white/10 p-2">
            <p className="px-2 text-[10px] text-[#64748b]">В команде</p>
            <ul className="mt-1 max-h-28 space-y-1 overflow-y-auto px-2">
              {staff.map((u) => (
                <li key={u.id} className="truncate text-[11px] text-[#9aa3ad]">
                  {u.displayName}
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <section className="flex min-h-[480px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#0a0c12]">
          {!channel ? (
            <div className="flex flex-1 items-center justify-center text-[13px] text-[#64748b]">
              Нет каналов
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-2 border-b border-white/10 px-4 py-3">
                <div>
                  <h2 className="text-[15px] font-medium text-white">
                    {channel.name}
                  </h2>
                  <p className="text-[11px] text-[#6b7280]">
                    {channel.desc || channel.type}
                  </p>
                </div>
                {channel.id !== "ch-general" ? (
                  <button
                    type="button"
                    onClick={() => {
                      deleteTeamChannel(channel.id);
                      setActiveId(teamChannels[0]?.id || "");
                    }}
                    className="rounded-lg p-1.5 text-rose-300"
                  >
                    <Trash2 size={14} />
                  </button>
                ) : null}
              </div>
              <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
                {(channel.messages || []).map((m) => {
                  const mine = m.from === profile?.email;
                  return (
                    <div
                      key={m.id}
                      className={[
                        "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[13px]",
                        mine
                          ? "ml-auto bg-[#2563eb]/20 text-[#dbeafe]"
                          : "bg-white/[0.05] text-[#e8eaed]",
                      ].join(" ")}
                    >
                      <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b7280]">
                        {m.name || m.from}
                        {m.at
                          ? ` · ${new Date(m.at).toLocaleString("ru-RU", {
                              hour: "2-digit",
                              minute: "2-digit",
                              day: "2-digit",
                              month: "short",
                            })}`
                          : ""}
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">
                        {m.text}
                      </p>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>
              <form
                onSubmit={send}
                className="flex gap-2 border-t border-white/10 p-3"
              >
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Сообщение команде…"
                  className="eh-term-input flex-1 text-[13px]"
                />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-xl bg-[#2563eb] px-4 py-2.5 text-white"
                >
                  <Send size={14} />
                </button>
              </form>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
