"use client";

import { useEffect, useState } from "react";

export function useSavedScenarios() {
  const [map, setMap] = useState({});

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me/scenarios", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { scenarios: [] }))
      .then((data) => {
        if (cancelled) return;
        const next = {};
        for (const row of data.scenarios || []) next[row.lotId] = row;
        setMap(next);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return map;
}
