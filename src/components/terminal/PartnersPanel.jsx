"use client";

import { useEffect, useState } from "react";
import { say } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/LocaleProvider";

export default function PartnersPanel() {
  const { locale } = useLocale();
  const s = (az, ru, en) => say(locale, az, ru, en);
  const [data, setData] = useState(null);
  const [note, setNote] = useState("");

  useEffect(() => {
    let live = true;
    fetch("/api/me/referral")
      .then((res) => res.json())
      .then((body) => {
        if (live) setData(body);
      })
      .catch(() => {
        if (live) setData({ configured: false });
      });
    return () => {
      live = false;
    };
  }, []);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://emlakhub.net";
  const link = data?.code ? `${origin}/register?ref=${data.code}` : "";

  const copy = async () => {
    if (!link) return;
    await navigator.clipboard.writeText(link);
    setNote(s("Kopyalandı", "Скопировано", "Copied"));
  };

  const share = async () => {
    if (!link) return;
    if (navigator.share) {
      await navigator.share({ title: "Emlak Partners", url: link });
      return;
    }
    await copy();
  };

  return (
    <section className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">Emlak Partners</p>
      <h2 className="mt-2 text-[16px] font-semibold text-white">
        {s("İnvestor dəvət edin. Əlavə PRO günləri alın.", "Приглашайте инвесторов. Получайте дополнительные дни PRO.", "Invite investors. Receive extra PRO days.")}
      </h2>
      <p className="mt-2 text-[12px] leading-relaxed text-[#94a3b8]">
        {s(
          `Dəvət etdiyiniz şəxs PRO-nu ilk dəfə ödəyəndə siz +${data?.program?.referrerDays ?? 7} gün, o isə +${data?.program?.referredDays ?? 3} gün alır.`,
          `Когда приглашённый впервые оплачивает PRO, вы получаете +${data?.program?.referrerDays ?? 7} дней, а он +${data?.program?.referredDays ?? 3}.`,
          `When the invited person first pays for PRO, you receive +${data?.program?.referrerDays ?? 7} days and they receive +${data?.program?.referredDays ?? 3}.`
        )}
      </p>
      <p className="mt-3 text-[11px] uppercase tracking-[0.12em] text-[#64748b]">{s("Mənim linkim", "Моя ссылка", "My link")}</p>
      <p className="mt-1 break-all font-mono text-[12px] text-white">{link || "…"}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" onClick={copy} className="rounded-xl bg-white px-3 py-2 text-[12px] font-semibold text-slate-950">
          {s("Kopyala", "Скопировать", "Copy")}
        </button>
        <button type="button" onClick={share} className="rounded-xl border border-white/15 px-3 py-2 text-[12px] text-white">
          {s("Paylaş", "Поделиться", "Share")}
        </button>
        <a
          href={link ? `https://t.me/share/url?url=${encodeURIComponent(link)}` : undefined}
          className="rounded-xl border border-white/15 px-3 py-2 text-[12px] text-white"
        >
          Telegram
        </a>
      </div>
      {note ? <p className="mt-2 text-[12px] text-emerald-300">{note}</p> : null}
      <dl className="mt-4 grid grid-cols-2 gap-3 text-[12px] sm:grid-cols-4">
        {[
          [s("Dəvət olunub", "Приглашено пользователей", "People invited"), data?.invited],
          [s("PRO ödəyib", "Оплатили PRO", "Paid for PRO"), data?.paid],
          [s("Bonus gün", "Получено бонусных дней", "Bonus days received"), data?.bonusDays],
          [s("Təsdiq gözləyir", "Ожидают подтверждения", "Awaiting confirmation"), data?.waiting],
        ].map(([label, value]) => (
          <div key={label}>
            <dt className="text-[#64748b]">{label}</dt>
            <dd className="mt-1 font-mono text-[16px] text-white">{value ?? "—"}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left text-[12px]">
          <thead className="text-[#64748b]">
            <tr>
              <th className="py-1 pr-3">{s("Tarix", "Дата", "Date")}</th>
              <th className="py-1 pr-3">{s("Status", "Статус", "Status")}</th>
              <th className="py-1">{s("Bonus", "Бонус", "Bonus")}</th>
            </tr>
          </thead>
          <tbody>
            {(data?.history || []).map((row) => (
              <tr key={`${row.at}-${row.status}`} className="border-t border-white/10 text-[#e2e8f0]">
                <td className="py-2 pr-3">{row.at ? new Date(row.at).toLocaleDateString() : "—"}</td>
                <td className="py-2 pr-3">{row.label?.[locale] || row.label?.ru || row.status}</td>
                <td className="py-2">{row.days ? `+${row.days}` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!data?.history?.length ? (
          <p className="mt-2 text-[12px] text-[#64748b]">{s("Hələ dəvət yoxdur", "Пока нет приглашений", "No invitations yet")}</p>
        ) : null}
      </div>
    </section>
  );
}
