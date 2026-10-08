"use client";

import { useCallback, useEffect, useState } from "react";
import { say } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/LocaleProvider";

function Cell({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
      <div className="text-[11px] uppercase tracking-[0.12em] text-[#64748b]">{label}</div>
      <div className="mt-2 font-mono text-[20px] text-white">{value ?? "—"}</div>
    </div>
  );
}

export default function GrowthDesk() {
  const { locale } = useLocale();
  const s = (az, ru, en) => say(locale, az, ru, en);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const empty = s("Məlumat yoxdur", "Нет данных", "No data");

  const load = useCallback(() => {
    fetch("/api/admin/growth")
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error || "Request failed");
        setData(body);
      })
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (patch) => {
    const res = await fetch("/api/admin/growth", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error || "Request failed");
      return;
    }
    load();
  };

  const m = data?.metrics;
  const show = (value) => (data?.configured === false || value == null ? empty : value);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-white">{s("Biznes və artım", "Бизнес и рост", "Business and growth")}</h1>
        <p className="mt-2 max-w-2xl text-sm text-[#94a3b8]">
          {s(
            "Yalnız PostgreSQL-də olan rəqəmlər. Avtomatik ödəniş qoşulmayıb.",
            "Только цифры из PostgreSQL. Автоматическая оплата не подключена.",
            "Only figures from PostgreSQL. Automatic payment is not connected."
          )}
        </p>
      </div>
      {error ? <p className="text-sm text-rose-300">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Cell label={s("Qeydiyyat", "Всего зарегистрированных", "Registered")} value={show(m?.registered)} />
        <Cell label={s("7 gün", "Новых за 7 дней", "New in 7 days")} value={show(m?.new7)} />
        <Cell label={s("30 gün", "Новых за 30 дней", "New in 30 days")} value={show(m?.new30)} />
        <Cell label={s("Aktiv PRO", "Активных PRO", "Active PRO")} value={show(m?.activePro)} />
        <Cell label={s("Təsdiqli gəlir, ₼", "Подтверждённая выручка, ₼", "Confirmed revenue, ₼")} value={show(m?.revenue)} />
        <Cell label={s("30 gündə ödəniş", "Новые оплаты за 30 дней", "New payments in 30 days")} value={show(m?.newPayments)} />
        <Cell label={s("Uzadılmalar", "Продления", "Renewals")} value={show(m?.renewals)} />
        <Cell label={s("Bitmiş PRO", "Истекшие подписки", "Expired subscriptions")} value={show(m?.expired)} />
        <Cell label={s("Referal qeydiyyat", "Реферальные регистрации", "Referral signups")} value={show(m?.referralSignups)} />
        <Cell label={s("Referal ödəniş", "Реферальные оплаты", "Referral payments")} value={show(m?.referralPayments)} />
        <Cell label={s("Bonus gün", "Начисленные бонусные дни", "Bonus days granted")} value={show(m?.bonusDays)} />
      </div>
      <section className="rounded-2xl border border-white/10 p-4">
        <h2 className="text-sm font-semibold text-white">{s("İstifadəçi hunisi", "Воронка пользователей", "User funnel")}</h2>
        <p className="mt-1 text-[12px] text-[#64748b]">
          {s(
            "Anonim ziyarətçi sayı yığılmır, ona görə bu mərhələ göstərilmir.",
            "Анонимные посетители не считаются, поэтому этот этап не показан.",
            "Anonymous visitors are not counted, so that stage is not shown."
          )}
        </p>
        <p className="mt-3 text-sm text-[#e2e8f0]">
          {s("Qeydiyyat", "Регистрация", "Registration")} {show(data?.funnel?.registered)}
          {" → "}
          {s("Tarif seçimi", "Выбор тарифа", "Plan choice")} {show(data?.funnel?.chosePlan)}
          {" → "}
          {s("Təsdiqli ödəniş", "Подтверждённая оплата", "Confirmed payment")} {show(data?.funnel?.confirmedPayment)}
        </p>
      </section>
      <section key={`${data?.config?.referrerDays ?? "a"}-${data?.config?.referredDays ?? "b"}`} className="rounded-2xl border border-white/10 p-4">
        <h2 className="text-sm font-semibold text-white">{s("Referal proqramı", "Реферальная программа", "Referral program")}</h2>
        <div className="mt-3 flex flex-wrap items-end gap-3 text-sm">
          <label className="text-[#94a3b8]">
            {s("Dəvət edən, gün", "Пригласивший, дни", "Inviter, days")}
            <input
              id="referrer-days"
              defaultValue={data?.config?.referrerDays ?? 7}
              className="mt-1 block w-24 rounded-xl border border-white/10 bg-black px-3 py-2 text-white"
            />
          </label>
          <label className="text-[#94a3b8]">
            {s("Dəvət olunan, gün", "Приглашённый, дни", "Invited, days")}
            <input
              id="referred-days"
              defaultValue={data?.config?.referredDays ?? 3}
              className="mt-1 block w-24 rounded-xl border border-white/10 bg-black px-3 py-2 text-white"
            />
          </label>
          <button
            type="button"
            className="rounded-xl bg-white px-3 py-2 text-[12px] font-semibold text-slate-950"
            onClick={() =>
              save({
                referrerDays: Number(document.getElementById("referrer-days").value),
                referredDays: Number(document.getElementById("referred-days").value),
              })
            }
          >
            {s("Gələcək bonus", "Будущий бонус", "Future bonus")}
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/15 px-3 py-2 text-[12px] text-white"
            onClick={() => save({ referralEnabled: data?.config?.referralEnabled === false })}
          >
            {data?.config?.referralEnabled === false
              ? s("Proqramı aç", "Включить программу", "Enable the program")
              : s("Proqramı dayandır", "Приостановить программу", "Pause the program")}
          </button>
        </div>
      </section>
      <section className="rounded-2xl border border-white/10 p-4">
        <h2 className="text-sm font-semibold text-white">{s("Şübhəli hadisələr", "Подозрительные события", "Suspicious events")}</h2>
        {(data?.suspicious || []).length ? (
          <ul className="mt-3 space-y-2 text-[12px] text-[#cbd5e1]">
            {data.suspicious.map((row) => (
              <li key={row.id}>
                {new Date(row.createdAt).toLocaleString()} · {row.status}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-[12px] text-[#64748b]">{empty}</p>
        )}
      </section>
      <section className="rounded-2xl border border-white/10 p-4">
        <h2 className="text-sm font-semibold text-white">{s("Bonus jurnalı", "Журнал начислений", "Grant journal")}</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-[12px]">
            <thead className="text-[#64748b]">
              <tr>
                <th className="py-1 pr-3">{s("Tarix", "Дата", "Date")}</th>
                <th className="py-1 pr-3">{s("Rol", "Роль", "Role")}</th>
                <th className="py-1 pr-3">{s("Gün", "Дни", "Days")}</th>
                <th className="py-1 pr-3">{s("Status", "Статус", "Status")}</th>
                <th className="py-1" />
              </tr>
            </thead>
            <tbody>
              {(data?.ledger || []).map((row) => (
                <tr key={row.id} className="border-t border-white/10 text-[#e2e8f0]">
                  <td className="py-2 pr-3">{new Date(row.createdAt).toLocaleString()}</td>
                  <td className="py-2 pr-3">{row.role}</td>
                  <td className="py-2 pr-3">{row.days}</td>
                  <td className="py-2 pr-3">{row.status}</td>
                  <td className="py-2">
                    {row.status === "granted" ? (
                      <button
                        type="button"
                        className="text-rose-300"
                        onClick={() => {
                          const reason = window.prompt(s("Səbəb", "Причина", "Reason"));
                          if (reason) save({ reverseGrantId: row.id, reason });
                        }}
                      >
                        {s("Ləğv et", "Отменить", "Reverse")}
                      </button>
                    ) : (
                      row.reverseReason || "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!data?.ledger?.length ? <p className="mt-2 text-[12px] text-[#64748b]">{empty}</p> : null}
        </div>
      </section>
    </div>
  );
}
