/**
 * Лоты — CRUD + чтение published
 */
import prisma from "@/lib/db/prisma";
import { LOT_MARKET_IDS } from "@/lib/lots/markets";
import { ensureLotCoords } from "@/lib/geo/azCities";
function moneyOrNull(value) {
  if (value == null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export async function listPublishedLots() {
  const rows = await prisma.lot.findMany({
    where: { status: "published" },
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapLotRow);
}

export async function listAllLots() {
  const rows = await prisma.lot.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return rows.map(mapLotRow);
}

export async function getLotById(id) {
  const row = await prisma.lot.findUnique({ where: { id } });
  return row ? mapLotRow(row) : null;
}

export async function createLot(input) {
  const market = LOT_MARKET_IDS.includes(input.market)
    ? input.market
    : "other";
  const row = await prisma.lot.create({
    data: {
      registryNo: input.registryNo || null,
      titleAz: input.titleAz || null,
      titleRu: input.titleRu || null,
      titleEn: input.titleEn || null,
      cityAz: input.cityAz || null,
      cityRu: input.cityRu || null,
      market,
      startPrice: input.startPrice != null ? input.startPrice : null,
      lat: input.lat != null ? Number(input.lat) : null,
      lng: input.lng != null ? Number(input.lng) : null,
      score: null,
      status: input.status || "draft",
      payload: input.payload || {},
    },
  });
  return mapLotRow(row);
}

export async function updateLot(id, input) {
  const data = {};
  const scalars = [
    "registryNo",
    "titleAz",
    "titleRu",
    "titleEn",
    "cityAz",
    "cityRu",
    "status",
  ];
  for (const k of scalars) {
    if (input[k] !== undefined) data[k] = input[k];
  }
  if (input.market !== undefined) {
    data.market = LOT_MARKET_IDS.includes(input.market)
      ? input.market
      : "other";
  }
  if (input.startPrice !== undefined) data.startPrice = input.startPrice;
  if (input.lat !== undefined)
    data.lat = input.lat == null ? null : Number(input.lat);
  if (input.lng !== undefined)
    data.lng = input.lng == null ? null : Number(input.lng);
  if (input.payload !== undefined) data.payload = input.payload;

  const row = await prisma.lot.update({ where: { id }, data });
  return mapLotRow(row);
}

export async function deleteLot(id) {
  await prisma.lot.delete({ where: { id } });
  return { ok: true };
}

/**
 * Upsert по registry_no (herrac auction id).
 * Координаты и скрытый статус не затираются. Колонка score не пишется.
 */
function payloadField(next, prev, key) {
  if (next && Object.prototype.hasOwnProperty.call(next, key)) return next[key];
  return prev?.[key] ?? null;
}

export async function upsertLotByRegistry(input) {
  const registryNo = String(input.registryNo || "").trim();
  if (!registryNo) {
    throw new Error("registryNo required for upsert");
  }

  const existing = await prisma.lot.findFirst({
    where: { registryNo },
  });

  if (!existing) {
    return createLot(input);
  }

  const prevPayload =
    existing.payload && typeof existing.payload === "object"
      ? existing.payload
      : {};
  const nextPayload = {
    ...prevPayload,
    ...(input.payload || {}),
    // фото из herrac всегда побеждают пустой кэш анализа
    photo:
      input.payload?.photo ||
      (Array.isArray(input.payload?.photos) && input.payload.photos[0]) ||
      prevPayload.photo ||
      null,
    photos:
      Array.isArray(input.payload?.photos) && input.payload.photos.length
        ? input.payload.photos
        : Array.isArray(prevPayload.photos)
          ? prevPayload.photos
          : [],
    // не затирать уже сохранённые текстовые поля карточки
    aiSummaryAz: prevPayload.aiSummaryAz || input.payload?.aiSummaryAz || "",
    aiSummaryRu: prevPayload.aiSummaryRu || input.payload?.aiSummaryRu || "",
    expectedMarginPct: payloadField(input.payload, prevPayload, "expectedMarginPct"),
    expectedProfit: payloadField(input.payload, prevPayload, "expectedProfit"),
    repairCost: payloadField(input.payload, prevPayload, "repairCost"),
    fees: payloadField(input.payload, prevPayload, "fees"),
    legalRisks: prevPayload.legalRisks?.length
      ? prevPayload.legalRisks
      : input.payload?.legalRisks || [],
    defects: input.payload?.defects?.length
      ? input.payload.defects
      : prevPayload.defects || [],
  };

  return updateLot(existing.id, {
    titleAz: input.titleAz,
    titleRu: input.titleRu,
    titleEn: input.titleEn,
    cityAz: input.cityAz,
    cityRu: input.cityRu,
    market: input.market,
    startPrice: input.startPrice,
    // координаты — только если ещё пусто
    lat: existing.lat ?? input.lat ?? null,
    lng: existing.lng ?? input.lng ?? null,
    status: existing.status === "hidden" ? "hidden" : input.status || existing.status,
    payload: nextPayload,
  });
}

export function mapLotRow(row) {
  const base = row.payload && typeof row.payload === "object" ? row.payload : {};
  const photos = Array.isArray(base.photos)
    ? base.photos.filter((u) => typeof u === "string" && u.trim())
    : base.photo
      ? [base.photo]
      : [];
  const coverPhoto = photos[0] || (typeof base.photo === "string" ? base.photo : null) || null;
  const startPrice = moneyOrNull(row.startPrice);

  const mapped = {
    id: row.id,
    registryNo: row.registryNo || row.id,
    titleAz: row.titleAz || base.titleAz || "",
    titleRu: row.titleRu || base.titleRu || "",
    titleEn: row.titleEn || base.titleEn || "",
    cityAz: row.cityAz || base.cityAz || "",
    cityRu: row.cityRu || base.cityRu || "",
    market: row.market || "estate",
    startPrice,
    lat: row.lat ?? base.lat ?? null,
    lng: row.lng ?? base.lng ?? null,
    status: row.status,
    publishStatus: row.status,
    source: base.source || "manual",
    herracUrl: base.herracUrl || null,
    typeAz: base.typeAz || null,
    typeRu: base.typeRu || null,
    photo: coverPhoto,
    photos,
    herracStatus: base.herracStatus || null,
    startAt: base.startAt || null,
    validUntil: base.validUntil || null,
    roundLabel: base.roundLabel || null,
    marketPrice: base.marketPrice ?? null,
    repairCost: base.repairCost ?? null,
    fees: base.fees ?? null,
    expectedMarginPct: base.expectedMarginPct ?? null,
    expectedProfit: base.expectedProfit ?? null,
    defects: base.defects || [],
    legalRisks: base.legalRisks || [],
    aiSummaryAz: base.aiSummaryAz || "",
    aiSummaryRu: base.aiSummaryRu || "",
    redFlags: Boolean(base.redFlags),
    districtAz: base.districtAz || "",
    districtRu: base.districtRu || "",
    landAreaSqm: base.landAreaSqm ?? null,
    landPurpose: base.landPurpose || null,
    ...base,
    id: row.id,
    market: row.market || base.market || "estate",
    status: row.status,
    startPrice,
    photos,
    photo: coverPhoto,
  };
  delete mapped.score;
  delete mapped.opportunityScore;
  delete mapped.scoreBasis;

  return ensureLotCoords(mapped);
}
