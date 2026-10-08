"use client";

/**
 * Пользователи из PostgreSQL (админка ↔ терминал одна база)
 */
import { useCallback, useEffect, useState } from "react";
import {
  fetchUsers,
  createUserApi,
  updateUserApi,
  deleteUserApi,
  wipeUserApi,
} from "@/lib/api/client";

export function useUsers({ role, enabled = true } = {}) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configured, setConfigured] = useState(null);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchUsers(role);
      setConfigured(Boolean(data.configured));
      setUsers(data.users || []);
    } catch (e) {
      setError(e.message || "Failed");
      setConfigured(false);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [role, enabled]);

  useEffect(() => {
    let cancelled = false;
    if (!enabled) {
      queueMicrotask(() => {
        if (!cancelled) setLoading(false);
      });
      return () => {
        cancelled = true;
      };
    }
    fetchUsers(role)
      .then((data) => {
        if (cancelled) return;
        setConfigured(Boolean(data.configured));
        setUsers(data.users || []);
        setError("");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "Failed");
        setConfigured(false);
        setUsers([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [role, enabled]);

  const create = useCallback(
    async (body) => {
      const data = await createUserApi(body);
      await reload();
      return data.user;
    },
    [reload]
  );

  const update = useCallback(
    async (id, body) => {
      const data = await updateUserApi(id, body);
      await reload();
      return data.user;
    },
    [reload]
  );

  const remove = useCallback(
    async (id) => {
      await deleteUserApi(id);
      await reload();
    },
    [reload]
  );

  const wipe = useCallback(
    async (id) => {
      const data = await wipeUserApi(id);
      await reload();
      return data.user;
    },
    [reload]
  );

  return {
    users,
    loading,
    configured,
    error,
    reload,
    create,
    update,
    remove,
    wipe,
  };
}
