"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api/client";
import { say } from "@/lib/i18n/copy";
import { useLocale } from "@/lib/i18n/LocaleProvider";

const HEALTH = {
  ok: { az: "Normal işləyir", ru: "Работает нормально", en: "Working normally", dot: "bg-[#86efac]" },
  slow: { az: "Mənbə yavaş cavab verir", ru: "Источник отвечает медленно", en: "The source is responding slowly", dot: "bg-[#fcd34d]" },
  rate_limit: { az: "Sorğu limiti var — gözləyirik", ru: "Получено ограничение запросов — ждём", en: "Request limit received — waiting", dot: "bg-[#fcd34d]" },
  running: { az: "Yoxlama gedir", ru: "Идёт проверка", en: "A check is running", dot: "bg-[#fcd34d]" },
  down: { az: "Mənbə müvəqqəti əlçatan deyil", ru: "Источник временно недоступен", en: "The source is temporarily unavailable", dot: "bg-[#fca5a5]" },
  partial: {
    az: "Məlum lotlar yeniləndi. Yeni lotların tamlığı yoxlanmayıb",
    ru: "Известные лоты обновлены. Полнота новых поступлений не проверена",
    en: "Known lots were updated. New arrivals were not fully checked",
    dot: "bg-[#fcd34d]",
  },
  restricted: {
    az: "Mənbə sorğunu rədd etdi",
    ru: "Источник отклонил запрос",
    en: "The source rejected the request",
    dot: "bg-[#fca5a5]",
  },
  not_configured: { az: "Sinxronizasiya qurulmayıb", ru: "Синхронизация не настроена", en: "Sync is not configured", dot: "bg-[#a8a29e]" },
  idle_history: {
    az: "Köhnə işlər var. İndi yoxlama getmir.",
    ru: "Прошлые запуски есть. Сейчас проверка не идёт.",
    en: "Past runs exist. Nothing is checking right now.",
    dot: "bg-[#a8a29e]",
  },
};

export default function HerracMonitor() {
  const { locale } = useLocale();
  const s = (az, ru, en) => say(locale, az, ru, en);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const next = await apiGet("/api/admin/herrac/sync");
    setData(next);
    setError("");
  }, []);

  useEffect(() => {
    let alive = true;
    apiGet("/api/admin/herrac/sync")
      .then((next) => {
        if (alive) setData(next);
      })
      .catch((e) => {
        if (alive) setError(e.message || "error");
      });
    return () => {
      alive = false;
    };
  }, []);

  async function run() {
    setBusy(true);
    setError("");
    try {
      await apiPost("/api/admin/herrac/sync", { forceDiscovery: true });
      await load();
    } catch (e) {
      setError(e.message || "error");
    } finally {
      setBusy(false);
    }
  }

  const sync = data?.sync;
  const latest = data?.history?.[0];
  const healthKey = data?.health?.key === "not_configured" && latest ? "idle_history" : data?.health?.key;
  const health = HEALTH[healthKey] || HEALTH.not_configured;

  return (
    <div className="mx-auto max-w-5xl px-5 py-8 text-[#e7e5e4]">
      <h1 className="text-[28px] font-semibold text-white">Hərrac Monitor</h1>
      <p className="mt-2 max-w-2xl text-[14px] text-[#a8a29e]">
        {s(
          "Yalnız açıq siyahı və kart. Avtomatlaşdırma gizlədilmir.",
          "Только открытый список и карточка. Автоматизация не прячется.",
          "Only the public list and card. Automation is not hidden."
        )}
      </p>

      <div className="mt-6 flex items-center gap-3">
        <span className={["h-2.5 w-2.5 rounded-full", health.dot].join(" ")} />
        <span className="text-[16px] text-white">{s(health.az, health.ru, health.en)}</span>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={s("Son cəhd", "Последняя попытка", "Last attempt")} value={clock(sync?.lastAttemptAt || latest?.startedAt)} />
        <Stat label={s("Son tam sync", "Последний полный sync", "Last full sync")} value={clock(sync?.lastFullSyncAt)} />
        <Stat label={s("Son məlum yeniləmə", "Последнее обновление известных", "Last known-lot update")} value={clock(sync?.lastSuccessAt)} />
        <Stat
          label={s("Növbəti yoxlama", "Следующая проверка", "Next check")}
          value={data?.scheduled ? "—" : s("Plan yoxdur", "Планировщик не установлен", "No scheduler is installed")}
        />
        <Stat label={s("Vəziyyət", "Состояние", "State")} value={sync?.status || "—"} />
      </dl>

      <div className="mt-6 grid grid-cols-3 gap-3 sm:grid-cols-6">
        <Stat label={s("Siyahı", "Список", "List")} value={sync?.catalogStatus || "—"} />
        <Stat label={s("Kartlar", "Карточки", "Cards")} value={sync?.detailStatus || "—"} />
        <Stat label={s("Yeni tapılıb", "Обнаружено новых", "New lots found")} value={sync?.discoveredNew ?? latest?.created ?? 0} />
        <Stat label={s("Alınıb", "Получено", "Received")} value={latest?.received ?? sync?.received ?? 0} />
        <Stat label={s("Yeni", "Новых", "New")} value={latest?.created ?? sync?.created ?? 0} />
        <Stat label={s("Dəyişən", "Изменено", "Changed")} value={latest?.updated ?? sync?.updated ?? 0} />
        <Stat label={s("Dəyişməyən", "Без изменений", "Unchanged")} value={latest?.unchanged ?? 0} />
        <Stat label={s("Aktiv siyahıda yox", "Нет в активном списке", "Absent from the active list")} value={latest?.closed ?? 0} />
        <Stat label={s("Xəta", "Ошибок", "Errors")} value={latest?.failed ?? sync?.failed ?? 0} />
      </div>

      <button
        type="button"
        disabled={busy}
        onClick={run}
        className="mt-6 rounded-full bg-white px-4 py-2 text-[13px] font-medium text-[#0b0d12] disabled:opacity-50"
      >
        {busy ? s("Yoxlanılır", "Проверяем", "Checking") : s("İndi yoxla", "Проверить сейчас", "Check now")}
      </button>
      {sync?.catalogStatus === "unavailable" ? (
        <p className="mt-4 max-w-2xl text-[14px] text-[#fcd34d]">
          {s(
            "Hərrac siyahısı əlçatan deyil. Yeni lotlar bu yoxlama ilə təsdiqlənməyib.",
            "Список Hərrac недоступен. Новые лоты этой проверкой не подтверждены.",
            "The Hərrac list is unavailable. This check did not confirm new lots."
          )}
        </p>
      ) : null}
      {sync?.error ? <p className="mt-3 max-w-2xl text-[13px] text-[#a8a29e]">{sync.error}</p> : null}
      {error ? <p className="mt-3 text-[13px] text-[#fca5a5]">{error}</p> : null}

      <h2 className="mt-10 text-[18px] font-semibold text-white">{s("Jurnal", "Журнал", "Journal")}</h2>
      <ul className="mt-3 space-y-1 font-mono text-[13px] text-[#d6d3d1]">
        {(data?.journal || []).length ? (
          data.journal.map((row, i) => (
            <li key={`${row.at}-${i}`}>
              {clock(row.at)} {say(locale, row.az, row.ru, row.en)}
            </li>
          ))
        ) : (
          <li className="text-[#78716c]">{s("Hazırda heç nə getmir.", "Сейчас ничего не выполняется.", "Nothing is running.")}</li>
        )}
      </ul>

      <h2 className="mt-10 text-[18px] font-semibold text-white">{s("Sorğular", "Запросы", "Requests")}</h2>
      <ul className="mt-3 space-y-1 font-mono text-[13px] text-[#d6d3d1]">
        {(data?.events || []).map((row, i) => (
          <li key={`${row.at}-${i}`}>
            {clock(row.at)} {row.kind} {row.path} {row.status} · {row.ms}ms · {row.attempt} · {row.result}
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-[18px] font-semibold text-white">{s("Keçmiş", "История", "History")}</h2>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full text-left text-[13px]">
          <thead className="text-[#a8a29e]">
            <tr>
              <th className="py-2 pr-3">{s("Başladı", "Старт", "Started")}</th>
              <th className="py-2 pr-3">{s("Alınıb", "Получено", "Received")}</th>
              <th className="py-2 pr-3">{s("Yeni", "Новых", "New")}</th>
              <th className="py-2 pr-3">{s("Dəyişən", "Изменено", "Changed")}</th>
              <th className="py-2 pr-3">{s("Eyni", "Без изменений", "Unchanged")}</th>
              <th className="py-2 pr-3">{s("Siyahıda yox", "Нет в списке", "Absent")}</th>
              <th className="py-2 pr-3">{s("Xəta", "Ошибок", "Errors")}</th>
            </tr>
          </thead>
          <tbody>
            {(data?.history || []).map((row) => (
              <tr key={String(row.startedAt)} className="border-t border-white/10">
                <td className="py-2 pr-3">{clock(row.startedAt)}</td>
                <td className="py-2 pr-3">{row.received}</td>
                <td className="py-2 pr-3">{row.created}</td>
                <td className="py-2 pr-3">{row.updated}</td>
                <td className="py-2 pr-3">{row.unchanged}</td>
                <td className="py-2 pr-3">{row.closed}</td>
                <td className="py-2 pr-3">{row.failed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div>
      <div className="text-[12px] text-[#a8a29e]">{label}</div>
      <div className="mt-1 text-[16px] text-white">{value}</div>
    </div>
  );
}

function clock(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
