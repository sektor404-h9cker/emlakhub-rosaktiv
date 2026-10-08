"use client";

/**
 * Лента поддержки из PostgreSQL.
 * Пока страница открыта, раз в несколько секунд подтягивает новые ответы.
 */
import { useCallback, useEffect, useState } from "react";
import {
  createSupportTicketApi,
  deleteSupportMessageApi,
  deleteSupportTicketApi,
  fetchSupportTickets,
  patchSupportMessageApi,
  patchSupportTicketApi,
  postSupportMessageApi,
} from "@/lib/api/client";

export function useSupportDesk() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    try {
      const data = await fetchSupportTickets();
      setTickets(data.tickets || []);
      setError("");
    } catch (e) {
      setError(e.message || "Поддержка временно недоступна. Попробуйте позже.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchSupportTickets()
      .then((data) => {
        if (cancelled) return;
        setTickets(data.tickets || []);
        setError("");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "Поддержка временно недоступна. Попробуйте позже.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    const timer = setInterval(() => {
      reload();
    }, 8000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [reload]);

  const createTicket = useCallback(
    async (input) => {
      const data = await createSupportTicketApi(input);
      await reload();
      return data.ticket;
    },
    [reload]
  );

  const sendMessage = useCallback(
    async (ticketId, body) => {
      const data = await postSupportMessageApi(ticketId, body);
      await reload();
      return data.ticket;
    },
    [reload]
  );

  const setStatus = useCallback(
    async (ticketId, status) => {
      await patchSupportTicketApi(ticketId, { status });
      await reload();
    },
    [reload]
  );

  const setLevel = useCallback(
    async (ticketId, level) => {
      await patchSupportTicketApi(ticketId, { level });
      await reload();
    },
    [reload]
  );

  const editMessage = useCallback(
    async (ticketId, messageId, text) => {
      await patchSupportMessageApi(ticketId, messageId, { body: text });
      await reload();
    },
    [reload]
  );

  const removeMessage = useCallback(
    async (ticketId, messageId) => {
      await deleteSupportMessageApi(ticketId, messageId);
      await reload();
    },
    [reload]
  );

  const removeTicket = useCallback(
    async (ticketId) => {
      await deleteSupportTicketApi(ticketId);
      await reload();
    },
    [reload]
  );

  return {
    tickets,
    loading,
    error,
    reload,
    createTicket,
    sendMessage,
    setStatus,
    setLevel,
    editMessage,
    removeMessage,
    removeTicket,
  };
}
