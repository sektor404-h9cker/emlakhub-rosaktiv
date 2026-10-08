"use client";

/**
 * FinanceTable - MRR, воронка, планы, транзакции + подсказки
 */

import { useMemo, useState } from "react";
import {
  Wallet,
  TrendingUp,
  Users,
  Percent,
  ArrowUpRight,
  ArrowDownRight,
  Trash2,
} from "lucide-react";
import { useSystem } from "@/context/SystemContext";
import { usePaymentsJournal } from "@/hooks/usePaymentsJournal";
import { useAuth } from "@/context/AuthContext";
import {
  FINANCE_KPI,
  MRR_SERIES,
  REVENUE_BY_PLAN,
  FUNNEL,
  pctChange,
} from "@/lib/financeDemo";
import { isProActive } from "@/lib/subscription";
import TermHint from "@/components/terminal/TermHint";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";
import { downloadCsv } from "@/lib/csvExport";
import { allowDemoFallback } from "@/lib/runtimePolicy";
import { money } from "@/components/terminal/lotStory/money";

const STATUS_META = {
  paid: { label: "оплачено", cls: "text-emerald-400" },
  pending: { label: "ожидание", cls: "text-amber-400" },
  stuck: { label: "зависло", cls: "text-red-400" },
  failed: { label: "ошибка", cls: "text-red-400" },
};

const TIPS = {
  mrr: "MRR - сколько денег в среднем приходит каждый месяц от подписок. Если растёт - бизнес дышит.",
  arr: "ARR - тот же MRR, но за год (MRR × 12). Удобно смотреть «масштаб» бизнеса.",
  arpu: "ARPU - средний чек с одного платящего. Сколько в среднем платит один PRO-клиент.",
  churn:
    "Churn - какой % клиентов ушёл за месяц. Чем ниже, тем лучше. LTV - сколько в среднем клиент принесёт за всё время.",
  freePro:
    "Какой % из Free в итоге купил PRO. Чем выше - тем лучше «превращаем» интерес в оплату.",
  trial:
    "Кто попробовал / заинтересовался PRO и реально заплатил. Сигнал качества онбординга.",
  netNew:
    "На сколько вырос MRR за период (новые минус ушедшие), простыми словами - «прирост».",
  funnel:
    "Воронка - путь человека: зашёл на сайт → зарегистрировался → Free → интерес к PRO → оплатил. Где узко - там чинить.",
  plans: "Откуда деньги: помесячно, годовой PRO или разовые платежи.",
};

export default function FinanceTable() {
  const { t, locale } = useAdminI18n();
  const {
    payments: demoPayments,
    setPaymentStatus,
    deletePayment,
    users,
  } = useSystem();
  const { rows: apiPayments, configured, confirmPayment, error: paymentsError } =
    usePaymentsJournal();
  const { refreshProfile } = useAuth();
  const payments =
    configured || !allowDemoFallback() ? apiPayments : demoPayments;
  const mrrDelta = pctChange(FINANCE_KPI.mrr, FINANCE_KPI.mrrPrev);
  const proCount = useMemo(
    () => users.filter((u) => isProActive(u.subscription)).length,
    [users]
  );
  const [payFilter, setPayFilter] = useState("all");
  const [payQ, setPayQ] = useState("");

  const maxFunnel = FUNNEL.length
    ? Math.max(...FUNNEL.map((f) => f.value))
    : 1;
  const maxMrr = MRR_SERIES.length ? Math.max(...MRR_SERIES) : 1;

  const journal = useMemo(() => {
    const qq = payQ.trim().toLowerCase();
    return [...payments]
      .sort((a, b) => (b.at || 0) - (a.at || 0))
      .filter((r) => {
        if (payFilter !== "all" && r.status !== payFilter) return false;
        if (!qq) return true;
        return (
          r.userEmail?.toLowerCase().includes(qq) ||
          r.id?.toLowerCase().includes(qq) ||
          r.plan?.toLowerCase().includes(qq)
        );
      });
  }, [payments, payFilter, payQ]);

  const journalSum = useMemo(
    () =>
      journal
        .filter((r) => r.status === "paid")
        .reduce((s, r) => s + Number(r.amount || 0), 0),
    [journal]
  );

  return (
    <div className="max-w-6xl space-y-5 pb-10">
      <header>
        <p className="text-[11px] uppercase tracking-[0.14em] text-[#78716c]">
          Admin · finance
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-[22px] font-semibold tracking-tight text-white">
          <Wallet size={18} className="text-[#a8a29e]" />
          {t.financeTitle}
        </h1>
        <p className="mt-1 text-[13px] text-[#9aa3ad]">{t.financeHint}</p>
        <p className="mt-1 text-[12px] text-[#64748b]">
          {locale === "az"
            ? "MRR və qıf üçün mənbə yoxdur. Aşağıdakı jurnal ödənişlərdəndir."
            : locale === "en"
              ? "No source for MRR or the funnel. The journal below comes from payments."
              : "Для MRR и воронки нет источника. Журнал ниже берётся из платежей."}
        </p>
        {paymentsError && !allowDemoFallback() ? (
          <p className="mt-2 text-[13px] text-amber-200">{paymentsError}</p>
        ) : null}
      </header>

      {MRR_SERIES.length === 0 ? (
        <p className="text-[14px] text-[#a8a29e]">
          {locale === "az" ? "Məlumat yoxdur" : locale === "en" ? "No data" : "Нет данных"}
        </p>
      ) : (
      <>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Kpi
          icon={TrendingUp}
          label="MRR"
          tip={TIPS.mrr}
          value={`${FINANCE_KPI.currency} ${FINANCE_KPI.mrr.toLocaleString("ru-RU")}`}
          delta={mrrDelta}
        />
        <Kpi
          icon={Wallet}
          label="ARR"
          tip={TIPS.arr}
          value={`${FINANCE_KPI.currency} ${FINANCE_KPI.arr.toLocaleString("ru-RU")}`}
        />
        <Kpi
          icon={Users}
          label="ARPU · PRO"
          tip={TIPS.arpu}
          value={`${FINANCE_KPI.currency} ${FINANCE_KPI.arpu} · ~${proCount}`}
        />
        <Kpi
          icon={Percent}
          label="Churn / LTV"
          tip={TIPS.churn}
          value={`${FINANCE_KPI.churn}% · ${FINANCE_KPI.currency}${FINANCE_KPI.ltv}`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <section className="border-b border-white/[0.08] pb-5 lg:col-span-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center text-[14px] font-semibold text-white">
              MRR · 12 недель
              <TermHint text={TIPS.mrr} />
            </h2>
            <span className="font-mono text-[11px] text-emerald-400">
              +{mrrDelta.toFixed(1)}% к прошлому
            </span>
          </div>
          <div className="mt-4 flex h-36 items-end gap-1.5 sm:gap-2">
            {MRR_SERIES.map((v, i) => (
              <div
                key={i}
                className="group relative flex-1 rounded-t-sm bg-white/25"
                style={{ height: `${Math.max(8, (v / maxMrr) * 100)}%` }}
                title={`${FINANCE_KPI.currency} ${v}`}
              >
                <span className="pointer-events-none absolute -top-6 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black/80 px-1.5 py-0.5 font-mono text-[9px] text-white group-hover:block">
                  {v}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <Mini
              label="Free→PRO"
              tip={TIPS.freePro}
              value={`${FINANCE_KPI.conversion}%`}
            />
            <Mini
              label="Trial→Paid"
              tip={TIPS.trial}
              value={`${FINANCE_KPI.trialToPaid}%`}
            />
            <Mini
              label="Net new MRR"
              tip={TIPS.netNew}
              value={`+${(FINANCE_KPI.mrr - FINANCE_KPI.mrrPrev).toLocaleString("ru-RU")}`}
            />
          </div>
        </section>

        <section className="border-b border-white/[0.08] pb-5 lg:col-span-2">
          <h2 className="flex items-center text-[14px] font-semibold text-white">
            Выручка по планам
            <TermHint text={TIPS.plans} />
          </h2>
          <ul className="mt-4 space-y-3">
            {REVENUE_BY_PLAN.map((r) => (
              <li key={r.plan}>
                <div className="flex justify-between text-[12px]">
                  <span className="text-[#9aa3ad]">{r.plan}</span>
                  <span className="font-mono text-white">
                    {FINANCE_KPI.currency} {r.amount.toLocaleString("ru-RU")}
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-white/40"
                    style={{ width: `${r.share}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="border-b border-white/[0.08] pb-5">
        <h2 className="flex items-center text-[14px] font-semibold text-white">
          Воронка роста
          <TermHint text={TIPS.funnel} />
        </h2>
        <div className="mt-4 space-y-2.5">
          {FUNNEL.map((f) => (
            <div
              key={f.stage}
              className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:grid-cols-[180px_1fr_auto]"
            >
              <span className="truncate text-[12px] text-[#9aa3ad]">
                {f.stage}
              </span>
              <div className="hidden h-2 overflow-hidden rounded-full bg-white/5 sm:block">
                <div
                  className="h-full rounded-full bg-sky-500/70"
                  style={{ width: `${(f.value / maxFunnel) * 100}%` }}
                />
              </div>
              <span className="font-mono text-[12px] tabular-nums text-white">
                {f.value.toLocaleString("ru-RU")}
              </span>
            </div>
          ))}
        </div>
      </section>
      </>
      )}

      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="flex items-center text-[14px] font-semibold text-white">
              {t.financeJournal}
              <TermHint text="Filter, search, status, delete from journal." />
            </h2>
            <p className="mt-1 text-[11px] text-[#64748b]">
              {journal.length} · {money(journalSum)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-xl border border-white/10 px-3 py-1.5 text-[12px] text-[#9aa3ad]"
              onClick={() =>
                downloadCsv(
                  "payments.csv",
                  journal.map((r) => ({
                    id: r.id,
                    email: r.userEmail,
                    plan: r.plan,
                    amount: r.amount,
                    status: r.status,
                    method: r.method,
                  }))
                )
              }
            >
              {t.exportCsv}
            </button>
            <input
              className="eh-term-input max-w-[200px] text-[12px]"
              placeholder="Поиск email / id"
              value={payQ}
              onChange={(e) => setPayQ(e.target.value)}
            />
            <select
              className="eh-term-input w-auto py-1.5 text-[12px]"
              value={payFilter}
              onChange={(e) => setPayFilter(e.target.value)}
            >
              <option value="all">Все статусы</option>
              {Object.keys(STATUS_META).map((s) => (
                <option key={s} value={s}>
                  {STATUS_META[s].label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-[0.14em] text-[#78716c]">
                <th className="px-4 py-3 font-medium">Когда</th>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Клиент</th>
                <th className="px-4 py-3 font-medium">План</th>
                <th className="px-4 py-3 font-medium">Способ</th>
                <th className="px-4 py-3 font-medium">Сумма</th>
                <th className="px-4 py-3 font-medium">Статус</th>
                <th className="px-4 py-3 font-medium">PRO период</th>
                <th className="px-4 py-3 font-medium">Действие</th>
              </tr>
            </thead>
            <tbody>
              {journal.map((r) => {
                const meta = STATUS_META[r.status] || STATUS_META.pending;
                return (
                  <tr key={r.id} className="border-b border-white/[0.06]">
                    <td className="px-4 py-3 font-mono text-[10px] text-[#64748b]">
                      {r.at
                        ? new Date(r.at).toLocaleString("ru-RU", {
                            day: "2-digit",
                            month: "short",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "-"}
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#9aa3ad]">
                      {r.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-white">{r.userEmail}</div>
                      {r.note ? (
                        <div className="text-[10px] text-[#64748b]">{r.note}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-[#c4c8ce]">{r.plan}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-[#9aa3ad]">
                      {r.method || "card"}
                    </td>
                    <td className="eh-num px-4 py-3 font-mono text-white">
                      {money(r.amount)}
                    </td>
                    <td className={`px-4 py-3 font-mono text-[11px] ${meta.cls}`}>
                      {meta.label}
                    </td>
                    <td className="px-4 py-3 font-mono text-[10px] text-[#64748b]">
                      {r.activeFrom && r.activeTo
                        ? `${new Date(r.activeFrom).toLocaleDateString("ru-RU")} → ${new Date(r.activeTo).toLocaleDateString("ru-RU")}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {configured && r.status === "pending" ? (
                          <button
                            type="button"
                            className="rounded-lg bg-emerald-600/20 px-2 py-1 text-[11px] text-emerald-300"
                            onClick={async () => {
                              await confirmPayment(r.id);
                              await refreshProfile?.();
                            }}
                          >
                            Подтвердить
                          </button>
                        ) : (
                          <select
                            value={r.status}
                            onChange={(e) =>
                              setPaymentStatus(r.id, e.target.value)
                            }
                            className="eh-term-input py-1.5 text-[12px]"
                            disabled={configured}
                          >
                            {Object.keys(STATUS_META).map((s) => (
                              <option key={s} value={s}>
                                {STATUS_META[s].label}
                              </option>
                            ))}
                          </select>
                        )}
                        {!configured ? (
                          <button
                            type="button"
                            onClick={() => deletePayment(r.id)}
                            className="rounded-lg p-1.5 text-rose-300"
                            title="Удалить из журнала"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!journal.length ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-8 text-center text-[12px] text-[#64748b]"
                  >
                    Нет транзакций в фильтре
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, delta, tip }) {
  const up = typeof delta === "number" && delta >= 0;
  return (
    <div className="border-t border-white/[0.08] pt-3">
      <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.14em] text-[#78716c]">
        <Icon size={13} />
        {label}
        {tip ? <TermHint text={tip} /> : null}
      </div>
      <div className="eh-num mt-2 text-[18px] font-medium tracking-tight text-white">
        {value}
      </div>
      {typeof delta === "number" ? (
        <div
          className={`mt-1 flex items-center gap-1 font-mono text-[11px] ${up ? "text-emerald-400" : "text-rose-400"}`}
        >
          {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
          {Math.abs(delta).toFixed(1)}%
        </div>
      ) : null}
    </div>
  );
}

function Mini({ label, value, tip }) {
  return (
    <div className="px-2 py-2">
      <div className="flex items-center justify-center gap-1 text-[10px] uppercase tracking-[0.12em] text-[#64748b]">
        {label}
        {tip ? <TermHint text={tip} /> : null}
      </div>
      <div className="mt-0.5 font-mono text-[13px] text-white">{value}</div>
    </div>
  );
}
