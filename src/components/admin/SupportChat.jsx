"use client";

/**
 * =============================================================================
 * SupportChat — защищённый чат (Firestore realtime / DEMO)
 * =============================================================================
 * Админ может редактировать и удалять ЛЮБЫЕ сообщения.
 * Клиент пишет в chats/{clientUid}/messages.
 * =============================================================================
 */

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  subscribeChatMessages,
  sendChatMessage,
  editChatMessage,
  deleteChatMessage,
  listUsers,
} from "@/lib/firebase/firestore";
import { ROLES } from "@/lib/firebase/constants";

export default function SupportChat() {
  const { user, profile } = useAuth();
  const [clients, setClients] = useState([]);
  const [clientUid, setClientUid] = useState("");
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  // Список инвесторов для выбора треда
  useEffect(() => {
    listUsers().then((rows) => {
      const inv = rows.filter(
        (u) => u.role === ROLES.INVESTOR || u.id?.startsWith("demo")
      );
      setClients(inv);
      if (inv[0]) setClientUid(inv[0].id);
    });
  }, []);

  // Подписка на сообщения выбранного клиента
  useEffect(() => {
    if (!clientUid) return undefined;
    const unsub = subscribeChatMessages(clientUid, setMessages);
    return () => unsub();
  }, [clientUid]);

  const send = async (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t || !clientUid) return;

    await sendChatMessage(clientUid, {
      text: t,
      senderId: user?.uid,
      senderRole: profile?.role || "admin",
    });

    // DEMO: локально дописываем, т.к. нет realtime
    setMessages((prev) => [
      ...prev,
      {
        id: `local-${Date.now()}`,
        text: t,
        senderId: user?.uid,
        senderRole: profile?.role || "admin",
        createdAt: Date.now(),
      },
    ]);
    setText("");
  };

  const saveEdit = async (msgId) => {
    await editChatMessage(clientUid, msgId, editText.trim());
    setMessages((prev) =>
      prev.map((m) => (m.id === msgId ? { ...m, text: editText.trim() } : m))
    );
    setEditingId(null);
  };

  const remove = async (msgId) => {
    await deleteChatMessage(clientUid, msgId);
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <header>
        <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#b8956c]">
          Admin · support
        </p>
        <h1 className="mt-1 font-serif text-2xl font-semibold text-white">
          Поддержка
        </h1>
        <p className="mt-1 text-[13px] text-[#9aa3ad]">
          Сообщения в Firestore. Админ может править и удалять любые.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[220px_1fr]">
        {/* Список клиентов */}
        <div className="rounded-xl border border-white/10 bg-[#0a0a0a] p-2">
          {clients.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setClientUid(c.id)}
              className={[
                "mb-1 w-full rounded-md px-3 py-2 text-left text-[12px]",
                clientUid === c.id
                  ? "bg-white/5 text-white"
                  : "text-[#9aa3ad] hover:bg-white/5",
              ].join(" ")}
            >
              <div className="truncate">{c.displayName || c.email}</div>
              <div className="truncate font-mono text-[9px] text-[#6b7280]">
                {c.email}
              </div>
            </button>
          ))}
        </div>

        {/* Тред */}
        <div className="flex min-h-[420px] flex-col rounded-xl border border-white/10 bg-[#0a0a0a]">
          <div className="flex-1 space-y-3 overflow-auto p-4">
            {messages.map((m) => {
              const mine = m.senderId === user?.uid;
              return (
                <div
                  key={m.id}
                  className={[
                    "max-w-[85%] rounded-lg px-3 py-2 text-[13px]",
                    mine
                      ? "ml-auto bg-[#b8956c]/15 text-[#e8d5b0]"
                      : "bg-white/5 text-[#e8eaed]",
                  ].join(" ")}
                >
                  <div className="mb-1 font-mono text-[9px] uppercase tracking-[0.14em] text-[#6b7280]">
                    {m.senderRole || "user"}
                  </div>

                  {editingId === m.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="eh-term-input min-h-[60px] text-[13px]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(m.id)}
                          className="eh-term-btn-ghost text-[11px]"
                        >
                          Сохранить
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="eh-term-btn-ghost text-[11px]"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="leading-relaxed">{m.text}</p>
                      <div className="mt-2 flex gap-2">
                        <button
                          type="button"
                          className="font-mono text-[9px] text-[#6b7280] hover:text-[#b8956c]"
                          onClick={() => {
                            setEditingId(m.id);
                            setEditText(m.text);
                          }}
                        >
                          edit
                        </button>
                        <button
                          type="button"
                          className="font-mono text-[9px] text-[#6b7280] hover:text-red-400"
                          onClick={() => remove(m.id)}
                        >
                          delete
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
            {messages.length === 0 ? (
              <p className="text-center text-[12px] text-[#6b7280]">
                Нет сообщений в этом треде
              </p>
            ) : null}
          </div>

          <form
            onSubmit={send}
            className="flex gap-2 border-t border-white/10 p-3"
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ответ клиенту…"
              className="eh-term-input flex-1 text-[13px]"
            />
            <button type="submit" className="eh-term-btn-primary px-4">
              Отправить
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
