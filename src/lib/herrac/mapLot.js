/**
 * Маппинг ответа herrac → поля Lot / payload
 */
import { HERRAC_ORIGIN, CATEGORY_TO_MARKET } from "./constants";
import { coordsForCity } from "@/lib/geo/azCities";
const CITY_PARAM = "Əmlakın yerləşdiyi şəhər və ya rayon";
const ADDR_PARAM = "Əmlakın yerləşdiyi ünvan";

function slugifyAz(text) {
  const map = {
    ə: "e",
    Ə: "e",
    ı: "i",
    İ: "i",
    ğ: "g",
    Ğ: "g",
    ö: "o",
    Ö: "o",
    ü: "u",
    Ü: "u",
    ç: "c",
    Ç: "c",
    ş: "s",
    Ş: "s",
  };
  return String(text || "")
    .split("")
    .map((ch) => map[ch] || ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

export function flattenLotParams(sectionData = []) {
  const out = {};
  for (const section of sectionData) {
    if (!section?.lotData) continue;
    for (const row of section.lotData) {
      if (!row?.paramName) continue;
      out[row.paramName] = row.valueText ?? null;
    }
  }
  return out;
}

function refineMarket(categoryId, lotName = "") {
  const base = CATEGORY_TO_MARKET[String(categoryId)] || "other";
  const n = String(lotName).toLowerCase();
  if (base === "auto") {
    if (
      /ekskavator|texnika|yarımqoşqu|yarimqosqu|traktor|yük|yuk|kamyon|bus|avtobus/.test(
        n
      )
    ) {
      return "equipment";
    }
  }
  if (/torpaq/.test(n)) return "land";
  return base;
}

function absImageUrl(path) {
  if (!path) return null;
  if (typeof path === "object" && path !== null) {
    path = path.url || path.href || path.path || path.fileUrl || path.id || "";
  }
  path = String(path || "").trim();
  if (!path) return null;
  if (path.startsWith("http")) return path;
  // API отдаёт "/v1/files/stream/…" → публичный стрим через /gw/fs
  if (path.startsWith("/v1/files/")) {
    return `${HERRAC_ORIGIN}/gw/fs${path}`;
  }
  if (path.startsWith("/")) return `${HERRAC_ORIGIN}${path}`;
  return `${HERRAC_ORIGIN}/gw/fs/v1/files/stream/${path}`;
}

/** Собираем URL фото из разных полей detail (у авто иногда другой ключ) */
function extractLotImages(detail = {}) {
  const bags = [
    detail.lotImageUrls,
    detail.lotImages,
    detail.imageUrls,
    detail.images,
    detail.photos,
    detail.files,
  ];
  const out = [];
  const seen = new Set();
  for (const bag of bags) {
    if (!bag) continue;
    const list = Array.isArray(bag) ? bag : [bag];
    for (const item of list) {
      const u = absImageUrl(item);
      if (u && !seen.has(u)) {
        seen.add(u);
        out.push(u);
      }
    }
  }
  return out;
}

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {object} detail — data из /auctions/details/:id
 * @param {{ slug?: string }} [meta]
 */
export function mapHerracDetailToLot(detail, meta = {}) {
  const id = String(detail.id);
  const params = flattenLotParams(detail.sectionData);
  const cityAz = params[CITY_PARAM] || "";
  const addressAz = params[ADDR_PARAM] || "";
  const titleAz = detail.lotName || `Hərrac #${id}`;
  const slug = meta.slug || slugifyAz(titleAz) || id;
  const herracUrl = `${HERRAC_ORIGIN}/auctions/${id}/${slug}`;
  const market = refineMarket(detail.categoryId, titleAz);
  const images = extractLotImages(detail);
  // Нет ни одного ценового поля — null. Ноль был бы лотом «за 0 ₼».
  const startPrice =
    num(detail.lastBidPrice) ??
    num(detail.offerPrice) ??
    num(detail.initialPrice) ??
    num(detail.lotPrice);

  const marketPrice = num(detail.lotPrice);
  const minSalePrice = num(detail.initialPrice);
  const deposit = num(detail.advanceAmount);
  const fee = num(detail.feeAmount);

  const notes = [
    params["Əlavə məlumat"],
    params["Əlavə qeyd"],
  ]
    .filter(Boolean)
    .join("\n\n");

  const redFlags =
    /borclud|işlək deyil|islək deyil|açar|saxlanma xərci|həbs|ipotek|fəaliyyət göstərmir/i.test(
      notes + " " + titleAz
    );

  const repairCost = null;
  const fees = deposit != null && fee != null ? deposit + fee : null;
  const expectedProfit = null;
  const expectedMarginPct = null;

  const geo = coordsForCity(cityAz, id);

  const landHa = num(
    params["Torpaq sahəsinin ölçüsü (hektarla)"] ||
      params["Torpaq sahəsi (ha)"] ||
      null
  );

  const payload = {
    source: "herrac",
    herracId: id,
    herracOrderId: detail.auctionOrderId || null,
    herracUrl,
    herracStatus: detail.status || null,
    categoryId: String(detail.categoryId || ""),
    categoryName: detail.categoryName || null,
    roundNumber: detail.roundNumber ?? null,
    roundLabel:
      detail.roundNumber == null
        ? null
        : Number(detail.roundNumber) <= 1
          ? "İlkin hərrac"
          : "Təkrar hərrac",
    startAt: detail.startAt || null,
    validUntil: detail.validUntil || null,
    isUpcoming:
      String(detail.status || "").toUpperCase() === "NOT_STARTED" ||
      String(detail.status || "").toUpperCase() === "PENDING",
    lotPrice: marketPrice,
    marketPrice,
    minSalePrice,
    lastBidPrice: num(detail.lastBidPrice),
    offerPrice: num(detail.offerPrice),
    deposit,
    fee,
    fees,
    repairCost,
    expectedProfit,
    expectedMarginPct,
    attendantsCount: num(detail.attendantsCount),
    noBids: detail.noBids == null ? null : Boolean(detail.noBids),
    minBidIncrement: num(detail.minBidIncrement),
    maxBidIncrement: num(detail.maxBidIncrement),
    lotLocation: detail.lotLocation || null,
    lotDataHighlight: detail.lotDataHighlight || null,
    attendanceStatus: detail.attendanceStatus || null,
    params,
    notes,
    photo: images[0] || null,
    photos: images,
    typeAz: detail.categoryName || null,
    typeRu: null,
    districtAz: addressAz,
    districtRu: "",
    redFlags,
    syncedAt: new Date().toISOString(),
    // авто
    vin: params["Ban nömrəsi"] || null,
    year: params["Buraxılış ili"] || null,
    bodyType: params["Ban növü"] || null,
    color: params["Rəng"] || null,
    mileageKm: num(params["Yürüş(km)"]),
    engine: params["Mühərrik"] || null,
    fuel: params["Yanacaq növü"] || null,
    gearbox: params["Sürətlər qutusu"] || null,
    isNew: params["Yeni"] || null,
    // недвижимость
    areaSqm: num(params["Sahəsi(m2)"]),
    rooms: num(params["Otaq sayı"]),
    floor: num(params["Mərtəbəsi"]),
    buildingStoreys: params["Binanın mərtəbəliliyi"] || null,
    lift: params["Lift"] || null,
    usageNote: params["Əmlakın istifadə olunması barədə"] || null,
    buildingType: params["Tikilinin növü"] || null,
    condition: params["Vəziyyəti"] || null,
    titleDoc: params["Hüquq müəyyən edici sənəd"] || null,
    landCategory: params["Torpaq sahəsinin kateqoriyası"] || null,
    landAreaHa: landHa,
    landAreaSqm: landHa != null ? Math.round(landHa * 10000 * 100) / 100 : null,
  };

  return {
    registryNo: id,
    titleAz,
    titleRu: titleAz,
    titleEn: titleAz,
    cityAz,
    cityRu: cityAz,
    market,
    startPrice,
    lat: geo?.lat ?? null,
    lng: geo?.lng ?? null,
    status: "published",
    payload,
  };
}

/** Лёгкий map из list-карточки (пока detail не подтянут) */
export function mapHerracListItemToStub(item) {
  const id = String(item.id || item.auctionId || "");
  const titleAz = item.lotName || item.name || `Hərrac #${id}`;
  const slug = item.slug || slugifyAz(titleAz) || id;
  return {
    id,
    slug,
    titleAz,
    categoryId: String(item.categoryId || ""),
    herracUrl: `${HERRAC_ORIGIN}/auctions/${id}/${slug}`,
  };
}
