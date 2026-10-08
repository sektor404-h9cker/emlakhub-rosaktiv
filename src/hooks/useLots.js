"use client";

/**
 * Лоты из GET /api/lots (PRO-gated на сервере)
 */
import { useCallback, useEffect, useState } from "react";
import { fetchLots } from "@/lib/api/client";
import { ensureLotCoords } from "@/lib/geo/azCities";

export function useLots({ adminView = false, enabled = true } = {}) {
  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(null);

  const reload = useCallback(async () => {
    if (!enabled) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const data = await fetchLots(adminView);
      setConfigured(Boolean(data.configured));
      setLots((data.lots || []).map(ensureLotCoords));
      if (data.error) setError(data.error);
    } catch (e) {
      setError(e.message || "Failed to load lots");
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, [adminView, enabled]);

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
    fetchLots(adminView)
      .then((data) => {
        if (cancelled) return;
        setConfigured(Boolean(data.configured));
        setLots((data.lots || []).map(ensureLotCoords));
        setError(data.error || "");
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message || "Failed to load lots");
        setLots([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [adminView, enabled]);

  return { lots, loading, error, configured, reload };
}
