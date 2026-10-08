"use client";

/**
 * Журнал платежей из PostgreSQL API (fallback: SystemContext demo)
 */
import { useCallback, useEffect, useState } from "react";
import { fetchPayments, confirmPaymentApi } from "@/lib/api/client";
import { useSystem } from "@/context/SystemContext";
import { allowDemoFallback } from "@/lib/runtimePolicy";

export function usePaymentsJournal() {
  const { payments: demoPayments } = useSystem();
  const [rows, setRows] = useState([]);
  const [configured, setConfigured] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchPayments();
      if (data.configured === false) {
        setConfigured(false);
        setError(data.error || "База не настроена.");
        setRows(allowDemoFallback() ? demoPayments || [] : []);
        return;
      }
      setConfigured(true);
      setRows(
        (data.payments || []).map((p) => ({
          id: p.id,
          userEmail: p.userEmail,
          userId: p.userId,
          plan: p.planId,
          planId: p.planId,
          amount: p.amount,
          status: p.status,
          activeFrom: p.activeFrom,
          activeTo: p.activeTo,
          at: p.createdAt,
          confirmedAt: p.confirmedAt,
          note: p.note,
        }))
      );
    } catch (e) {
      setConfigured(false);
      setError(e.message || "Платежи временно недоступны. Попробуйте позже.");
      setRows(allowDemoFallback() ? demoPayments || [] : []);
    } finally {
      setLoading(false);
    }
  }, [demoPayments]);

  useEffect(() => {
    let cancelled = false;
    fetchPayments()
      .then((data) => {
        if (cancelled) return;
        if (data.configured === false) {
          setConfigured(false);
          setError(data.error || "База не настроена.");
          setRows(allowDemoFallback() ? demoPayments || [] : []);
          return;
        }
        setConfigured(true);
        setError("");
        setRows(
          (data.payments || []).map((p) => ({
            id: p.id,
            userEmail: p.userEmail,
            userId: p.userId,
            plan: p.planId,
            planId: p.planId,
            amount: p.amount,
            status: p.status,
            activeFrom: p.activeFrom,
            activeTo: p.activeTo,
            at: p.createdAt,
            confirmedAt: p.confirmedAt,
            note: p.note,
          }))
        );
      })
      .catch((e) => {
        if (cancelled) return;
        setConfigured(false);
        setError(e.message || "Платежи временно недоступны. Попробуйте позже.");
        setRows(allowDemoFallback() ? demoPayments || [] : []);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [demoPayments]);

  const confirmPayment = useCallback(
    async (paymentId) => {
      if (!configured) return null;
      const data = await confirmPaymentApi(paymentId);
      await reload();
      return data;
    },
    [configured, reload]
  );

  return { rows, loading, configured, error, reload, confirmPayment };
}
