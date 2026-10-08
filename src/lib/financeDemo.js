/**
 * Метрики финансов — без фейковых цифр.
 * Реальные KPI считаются из payments в UI (когда БД подключена).
 */

export const FINANCE_KPI = {
  mrr: 0,
  mrrPrev: 0,
  arr: 0,
  arpu: 0,
  churn: 0,
  ltv: 0,
  conversion: 0,
  trialToPaid: 0,
  currency: "₼",
};

export const MRR_SERIES = [];

export const REVENUE_BY_PLAN = [];

export const FUNNEL = [];

/** Пустой журнал — источник правды: PostgreSQL payments */
export const DEMO_PAYMENTS = [];

export function pctChange(current, prev) {
  if (!prev) return 0;
  return ((Number(current) - Number(prev)) / Number(prev)) * 100;
}
