"use client";

/**
 * LotsManager — лоты из PostgreSQL (admin CRUD)
 * Рынки: auto | estate | land | commercial | equipment | other
 */

import { useEffect, useMemo, useState } from "react";
import { MapPinned, Plus } from "lucide-react";
import { useLots } from "@/hooks/useLots";
import {
  createLotApi,
  updateLotApi,
  deleteLotApi,
  syncHerracApi,
} from "@/lib/api/client";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";
import { downloadCsv } from "@/lib/csvExport";
import { LOT_MARKETS, marketLabel } from "@/lib/lots/markets";
import { risksForMarket } from "@/lib/herrac/knowledge";

const EMPTY_FORM = {
  registryNo: "",
  titleAz: "",
  titleRu: "",
  cityAz: "",
  cityRu: "",
  market: "land",
  startPrice: "",
  lat: "",
  lng: "",
  status: "draft",
};

export default function LotsManager() {
  const { t, locale } = useAdminI18n();
  const { lots, loading, configured, reload } = useLots({
    adminView: true,
    enabled: true,
  });
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [market, setMarket] = useState("all");
  const [form, setForm] = useState(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [syncBusy, setSyncBusy] = useState(false);
  const [syncMsg, setSyncMsg] = useState("");
  const [syncState, setSyncState] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetch("/api/admin/herrac/sync", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled) setSyncState(data?.sync || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [syncMsg]);

  const rows = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return lots.filter((l) => {
      const st = l.publishStatus || l.status;
      if (status !== "all" && st !== status) return false;
      if (market !== "all" && l.market !== market) return false;
      if (!qq) return true;
      const title = (locale === "az" ? l.titleAz : l.titleRu) || "";
      return (
        l.id?.toLowerCase().includes(qq) ||
        l.registryNo?.toLowerCase().includes(qq) ||
        title.toLowerCase().includes(qq)
      );
    });
  }, [lots, q, status, market, locale]);

  const statusLabel = (s) => {
    if (s === "published") return t.lotsPublished;
    if (s === "draft") return t.lotsDraft;
    return t.lotsHidden;
  };

  const onCreate = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr("");
    try {
      const risks = risksForMarket(form.market, locale);
      await createLotApi({
        registryNo: form.registryNo || undefined,
        titleAz: form.titleAz,
        titleRu: form.titleRu,
        cityAz: form.cityAz,
        cityRu: form.cityRu,
        market: form.market,
        startPrice: form.startPrice ? Number(form.startPrice) : null,
        lat: form.lat !== "" ? Number(form.lat) : null,
        lng: form.lng !== "" ? Number(form.lng) : null,
        status: form.status,
        payload: {
          legalRisks: risks,
          source: "manual",
        },
      });
      setForm(EMPTY_FORM);
      await reload();
    } catch (ex) {
      setErr(ex.message || "Error");
    } finally {
      setBusy(false);
    }
  };

  const setLotStatus = async (lot, next) => {
    await updateLotApi(lot.id, { status: next });
    await reload();
  };

  const onHerracSync = async () => {
    setSyncBusy(true);
    setSyncMsg("");
    setErr("");
    try {
      const data = await syncHerracApi({ forceDiscovery: true });
      if (data.sync) setSyncState(data.sync);
      if (data.started) {
        setSyncMsg("Проверка списка запущена. Новые лоты появятся в терминале, когда она закончится. Ход — в Hərrac Monitor.");
      } else {
        const r = data.report || {};
        setSyncMsg(
          `Herrac: discovery ${r.discovery?.ok ? "ok" : "fail"} (${r.discovery?.found || 0}), upsert ${r.details?.upserted || 0}, err ${r.details?.errors?.length || 0}`
        );
        await reload();
      }
    } catch (ex) {
      setErr(ex.message || "Sync failed");
    } finally {
      setSyncBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#93c5fd]">
            Admin · lots · PostgreSQL
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
            <MapPinned size={22} className="text-[#60a5fa]" />
            {t.lotsTitle}
          </h1>
          <p className="mt-1 text-[13px] text-[#9aa3ad]">
            {configured === false
              ? "Нужен DATABASE_URL — лоты из Postgres."
              : t.lotsHint}
          </p>
          {syncMsg ? (
            <p className="mt-1 font-mono text-[11px] text-[#34d399]">{syncMsg}</p>
          ) : null}
          <SyncStatus state={syncState} locale={locale} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={syncBusy || configured === false}
            onClick={onHerracSync}
            className="rounded-xl border border-[#60a5fa]/35 bg-[#60a5fa]/10 px-3 py-2 text-[12px] text-[#93c5fd] disabled:opacity-40"
          >
            {syncBusy ? "Проверяем список…" : "Проверить новые лоты"}
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/10 px-3 py-2 text-[12px] text-[#9aa3ad]"
            onClick={() =>
              downloadCsv(
                "lots.csv",
                rows.map((l) => ({
                  id: l.id,
                  registry: l.registryNo,
                  market: l.market,
                  status: l.status,
                  start: l.startPrice,
                }))
              )
            }
          >
            {t.exportCsv}
          </button>
        </div>
      </header>

      <form
        onSubmit={onCreate}
        className="grid gap-2 rounded-2xl border border-white/10 bg-[#0a0c12] p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="sm:col-span-2 lg:col-span-4 flex items-center gap-2 text-[12px] font-semibold text-white">
          <Plus size={14} /> Новый лот
        </div>
        <input
          className="eh-term-input"
          placeholder="Реестр / №"
          value={form.registryNo}
          onChange={(e) => setForm((f) => ({ ...f, registryNo: e.target.value }))}
        />
        <select
          className="eh-term-input"
          value={form.market}
          onChange={(e) => setForm((f) => ({ ...f, market: e.target.value }))}
        >
          {Object.values(LOT_MARKETS).map((m) => (
            <option key={m.id} value={m.id}>
              {locale === "az" ? m.labelAz : m.labelRu}
            </option>
          ))}
        </select>
        <input
          className="eh-term-input"
          placeholder="Title AZ"
          value={form.titleAz}
          onChange={(e) => setForm((f) => ({ ...f, titleAz: e.target.value }))}
          required
        />
        <input
          className="eh-term-input"
          placeholder="Title RU"
          value={form.titleRu}
          onChange={(e) => setForm((f) => ({ ...f, titleRu: e.target.value }))}
        />
        <input
          className="eh-term-input"
          placeholder="Şəhər AZ"
          value={form.cityAz}
          onChange={(e) => setForm((f) => ({ ...f, cityAz: e.target.value }))}
        />
        <input
          className="eh-term-input"
          placeholder="Город RU"
          value={form.cityRu}
          onChange={(e) => setForm((f) => ({ ...f, cityRu: e.target.value }))}
        />
        <input
          className="eh-term-input"
          placeholder="Start ₼"
          value={form.startPrice}
          onChange={(e) => setForm((f) => ({ ...f, startPrice: e.target.value }))}
        />
        <input
          className="eh-term-input"
          placeholder="lat"
          value={form.lat}
          onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))}
        />
        <input
          className="eh-term-input"
          placeholder="lng"
          value={form.lng}
          onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))}
        />
        <select
          className="eh-term-input"
          value={form.status}
          onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
        >
          <option value="draft">{t.lotsDraft}</option>
          <option value="published">{t.lotsPublished}</option>
          <option value="hidden">{t.lotsHidden}</option>
        </select>
        <button
          type="submit"
          disabled={busy || configured === false}
          className="rounded-xl bg-[#2563eb] px-3 py-2 text-[13px] font-semibold text-white disabled:opacity-50"
        >
          {busy ? "…" : "Создать"}
        </button>
        {err ? (
          <p className="sm:col-span-2 lg:col-span-4 text-[12px] text-rose-400">{err}</p>
        ) : null}
      </form>

      <div className="flex flex-wrap gap-2">
        <input
          className="eh-term-input max-w-xs flex-1"
          placeholder={t.search}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select
          className="eh-term-input w-auto"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="all">{t.all}</option>
          <option value="published">{t.lotsPublished}</option>
          <option value="draft">{t.lotsDraft}</option>
          <option value="hidden">{t.lotsHidden}</option>
        </select>
        <select
          className="eh-term-input w-auto"
          value={market}
          onChange={(e) => setMarket(e.target.value)}
        >
          <option value="all">{t.all}</option>
          {Object.keys(LOT_MARKETS).map((id) => (
            <option key={id} value={id}>
              {marketLabel(id, locale)}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-[#0a0c12]">
        <table className="w-full min-w-[800px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-white/10 font-mono text-[9px] uppercase tracking-[0.14em] text-[#64748b]">
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Тип</th>
              <th className="px-4 py-3">Lot</th>
              <th className="px-4 py-3">Start</th>
              <th className="px-4 py-3">{t.status}</th>
              <th className="px-4 py-3">{t.actions}</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#64748b]">
                  …
                </td>
              </tr>
            ) : null}
            {rows.map((l) => (
              <tr key={l.id} className="border-b border-white/[0.06]">
                <td className="px-4 py-3 font-mono text-[11px] text-[#9aa3ad]">
                  {l.registryNo || l.id}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#94a3b8]">
                  {marketLabel(l.market, locale)}
                </td>
                <td className="px-4 py-3 text-white">
                  {locale === "az" ? l.titleAz : l.titleRu || l.titleAz}
                </td>
                <td className="px-4 py-3 font-mono text-white">
                  {l.startPrice == null
                    ? "—"
                    : `₼ ${Number(l.startPrice).toLocaleString("en-US")}`}
                </td>
                <td className="px-4 py-3 text-[12px] text-[#9aa3ad]">
                  {statusLabel(l.status)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1.5">
                    <select
                      className="eh-term-input py-1.5 text-[12px]"
                      value={l.status || "draft"}
                      onChange={(e) => setLotStatus(l, e.target.value)}
                      disabled={configured === false}
                    >
                      <option value="published">{t.lotsPublished}</option>
                      <option value="draft">{t.lotsDraft}</option>
                      <option value="hidden">{t.lotsHidden}</option>
                    </select>
                    <button
                      type="button"
                      className="rounded-lg px-2 py-1 text-[11px] text-rose-300"
                      onClick={async () => {
                        await deleteLotApi(l.id);
                        await reload();
                      }}
                    >
                      Del
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && !rows.length ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-[12px] text-[#64748b]"
                >
                  Лотов нет — создайте вручную или дождитесь парсера herrac.gov.az
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SyncStatus({ state, locale }) {
  const label =
    locale === "az" ? "Hərrac sync" : locale === "en" ? "Hərrac sync" : "Hərrac sync";
  const none =
    locale === "az"
      ? "Hələ işə salınmayıb. Cron bu proqramda qurulmayıb."
      : locale === "en"
        ? "Not run yet. No schedule is configured in this app."
        : "Ещё не запускался. Расписание в этом приложении не настроено.";
  const when = (value) => {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleString(locale === "az" ? "az" : locale === "en" ? "en" : "ru");
  };
  if (!state || state.status === "idle") {
    return (
      <p className="mt-2 text-[12px] text-[#a8a29e]">
        {label}: {none}
      </p>
    );
  }
  return (
    <p className="mt-2 text-[12px] leading-relaxed text-[#a8a29e]">
      {label}: {state.status}. {locale === "en" ? "Last attempt" : locale === "az" ? "Son cəhd" : "Последняя попытка"}{" "}
      {when(state.lastAttemptAt)}. {locale === "en" ? "Last success" : locale === "az" ? "Son uğur" : "Последний успех"}{" "}
      {when(state.lastSuccessAt)}. received {state.received}, created {state.created}, updated {state.updated}, failed{" "}
      {state.failed}
      {state.error ? `. ${state.error}` : ""}
    </p>
  );
}
