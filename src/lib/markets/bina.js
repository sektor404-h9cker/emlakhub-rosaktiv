/**
 * bina.az comps — квартиры / дома / земля / коммерция.
 * Парсим herrac → фильтр GraphQL + сверка района по названию.
 */
import { marketFetch } from "./http";
import {
  UNAVAILABLE_TEXT,
  applyPriceOutliers,
  buildEvidence,
  rateSample,
  summarizePrices,
  tagReject,
} from "./engine";
import { MARKET_RULES } from "../productRules";
import { parseEstateIdentity } from "./estateIdentity";
import BINA_LOCATIONS from "./binaLocations.json";

const GQL = "https://bina.az/graphql";
const SEARCH_HASH =
  "b781511a943a4d710eefdf811a24dd4ae353e55d836952603ce0b37fde97d073";

/** categoryId на bina.az */
export const BINA_CATEGORY = {
  apartment: "1",
  // 2 — часто дачи/участки в выдаче; 5 — дома
  house: "5",
  office: "8",
  land: "9",
  landLarge: "10",
};

export const BINA_CITY = {
  baku: "1",
  // Sumqayıt и др. — при необходимости расширим
};

/** placeKey из estateIdentity → locationIds bina */
const PLACE_LOCATION_IDS = {
  nesimi: ["25", "190", "58", "60", "171", "176"],
  nerimanov: ["31", "1", "2", "10", "26"],
  nizami: ["11", "34", "35"],
  xetai: ["36", "180"],
  sebail: ["12"],
  sabuncu: ["69"], // Bakıxanov в Sabunçu — ближайший якорь
  bakixanov: ["69"],
  suraxani: ["87", "88"],
  bineqedi: ["18"],
  yeni_yasamal: ["102"],
  yasamal: ["102"], // Yeni Yasamal + текстовый фильтр Yasamal
  ahmadli: ["51", "178"],
  elmlar: ["29", "181"],
  "28may": ["8", "12", "28"],
  iceri: ["27", "30", "32"],
  badamdar: ["46"],
  lokbatan: ["20", "57"],
  mardakan: ["15"],
  bina: ["79"],
};

function fold(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ə/g, "e")
    .replace(/ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/ç/g, "c");
}

function locationIdsForPlace(placeKey, placeLabels = []) {
  const ids = new Set(PLACE_LOCATION_IDS[placeKey] || []);
  const needles = [placeKey, ...placeLabels].map(fold).filter(Boolean);
  for (const [id, loc] of Object.entries(BINA_LOCATIONS)) {
    const hay = fold(`${loc.name} ${loc.fullName}`);
    if (needles.some((n) => n.length >= 4 && hay.includes(n))) {
      ids.add(String(loc.id || id));
    }
  }
  return [...ids].slice(0, 8);
}

function resolveCityId(city) {
  const c = fold(city);
  if (!c) return null;
  if (/baki|baku|bakı/.test(c)) return BINA_CITY.baku;
  return null;
}

function cityIdForIdentity(idn) {
  const direct = resolveCityId(idn.city);
  if (direct) return direct;
  const ids = locationIdsForPlace(idn.placeKey, idn.placeLabels);
  const place = fold(`${idn.city} ${idn.district || ""} ${idn.placeLabels?.join(" ") || ""}`);
  if (ids.length && /abseron|mehdiabad|masazir|hokmali|lokbatan|mardakan/.test(place)) {
    return BINA_CITY.baku;
  }
  return null;
}

/**
 * @param {{
 *   cityId?: string|null,
 *   categoryId?: string,
 *   rooms?: number|null,
 *   priceFrom?: number|null,
 *   priceTo?: number|null,
 *   areaFrom?: number|null,
 *   areaTo?: number|null,
 *   locationIds?: string[],
 *   first?: number,
 * }} filter
 */
export async function searchBinaItems(filter = {}) {
  const cityId = filter.cityId;
  if (cityId == null) {
    return [];
  }

  const baseFilter = {
    cityId: String(cityId),
    categoryId: String(filter.categoryId || BINA_CATEGORY.apartment),
    leased: false,
  };
  if (filter.rooms) {
    baseFilter.roomIds = [
      String(Math.min(5, Math.max(1, Math.round(filter.rooms)))),
    ];
  }
  if (filter.priceFrom != null) baseFilter.priceFrom = Number(filter.priceFrom);
  if (filter.priceTo != null) baseFilter.priceTo = Number(filter.priceTo);
  if (filter.areaFrom != null) baseFilter.areaFrom = Number(filter.areaFrom);
  if (filter.areaTo != null) baseFilter.areaTo = Number(filter.areaTo);
  if (filter.locationIds?.length) {
    baseFilter.locationIds = filter.locationIds.map(String);
  }

  const body = {
    operationName: "SearchItems",
    variables: {
      first: filter.first ?? 20,
      filter: baseFilter,
      sort: "BUMPED_AT_DESC",
    },
    extensions: {
      persistedQuery: { version: 1, sha256Hash: SEARCH_HASH },
    },
  };

  const json = await marketFetch(GQL, {
    json: true,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://bina.az",
      Referer: "https://bina.az/",
    },
    body: JSON.stringify(body),
  });

  if (json?.errors?.length) {
    throw new Error(json.errors[0]?.message || "bina.az GraphQL error");
  }

  const edges = json?.data?.itemsConnection?.edges || [];
  return edges
    .map((e) => e?.node)
    .filter(Boolean)
    .map((n) => {
      const area = Number(n.area?.value) || null;
      const price = Number(n.price?.total) || null;
      const ppsm =
        area && price ? Math.round((price / area) * 100) / 100 : null;
      return {
        source: "bina",
        id: String(n.id),
        url: `https://bina.az${n.path || `/items/${n.id}`}`,
        price,
        currency: n.price?.currency || "AZN",
        areaSqm: area,
        rooms: n.rooms ?? null,
        floor: n.floor ?? null,
        floors: n.floors ?? null,
        city: n.city?.name || "",
        location: n.location?.fullName || n.location?.name || "",
        locationId: n.location?.id || null,
        hasRepair: n.hasRepair == null ? null : Boolean(n.hasRepair),
        pricePerSqm: ppsm,
        photo: n.preview?.thumbnail || n.preview?.f460x345 || null,
        updatedAt: n.updatedAt || null,
      };
    });
}

export function matchesPlace(item, placeLabels) {
  if (!placeLabels?.length) return true;
  const hay = fold(`${item.city} ${item.location}`);
  return placeLabels.some((l) => {
    const n = fold(l);
    return n.length >= 4 && hay.includes(n);
  });
}

function areaClose(cardArea, target, lo = MARKET_RULES.areaLo, hi = MARKET_RULES.areaHi) {
  if (!Number.isFinite(cardArea) || !Number.isFinite(target) || target <= 0) return false;
  return cardArea >= target * lo && cardArea <= target * hi;
}

function roomsClose(cardRooms, lotRooms) {
  if (!Number.isFinite(lotRooms)) return true;
  if (cardRooms == null || cardRooms === "") return false;
  const n = Number(cardRooms);
  if (!Number.isFinite(n)) return false;
  if (lotRooms >= 5) return n >= 5;
  return n === lotRooms;
}

function landAreaClose(cardArea, landHa) {
  if (!landHa || !cardArea) return false;
  const sot = landHa * 100;
  const sqm = landHa * 10000;
  return (
    areaClose(cardArea, sot, MARKET_RULES.landAreaLo, MARKET_RULES.landAreaHi) ||
    areaClose(cardArea, sqm, MARKET_RULES.landAreaLo, MARKET_RULES.landAreaHi)
  );
}

function medianPerSqm(items) {
  const values = items
    .map((item) => item.pricePerSqm)
    .filter((n) => Number.isFinite(n) && n > 0)
    .sort((a, b) => a - b);
  if (values.length < 3) return null;
  const mid = Math.floor(values.length / 2);
  return values.length % 2
    ? values[mid]
    : Math.round(((values[mid - 1] + values[mid]) / 2) * 100) / 100;
}

function statusLabel(status) {
  if (status === "high") return "Высокая";
  if (status === "medium") return "Средняя";
  if (status === "low") return "Низкая";
  return "Недостаточно данных";
}

function estateShell(idn, extra) {
  return {
    ok: false,
    marketStatus: "insufficient",
    marketStatusLabelRu: "Недостаточно данных",
    source: "bina.az",
    fetchedAt: new Date().toISOString(),
    identity: idn,
    query: { ...idn, label: idn.label },
    counts: { found: 0, accepted: 0, rejected: 0, used: 0 },
    comps: [],
    rejected: [],
    nearby: [],
    nearbyNoteRu: null,
    stats: null,
    outlierRule: null,
    warnings: [],
    ...extra,
  };
}

/**
 * Comps для квартиры / дома / земли / коммерции.
 * Район основной оценки не расширяется молча.
 */
export async function compsForEstateLot(lot) {
  const idn = parseEstateIdentity(lot);
  const cityId = cityIdForIdentity(idn);
  const fetchedAt = new Date().toISOString();
  const districtKnown = Boolean(idn.placeLabels?.length || idn.district);
  const area = idn.areaSqm;
  const rooms = idn.rooms;
  const strict = idn.kind === "land" || idn.kind === "commercial";

  const identityText = [
    idn.kind === "apartment"
      ? "квартира"
      : idn.kind === "house"
        ? "дом"
        : idn.kind === "land"
          ? "земля"
          : idn.kind === "commercial"
            ? "коммерческий объект"
            : "тип не определён",
    idn.district || idn.city || "район неизвестен",
    rooms ? `${rooms} комн.` : null,
    area ? `${area} м²` : null,
    idn.floor != null ? `этаж ${idn.floor}` : null,
    idn.repairState === "yes" ? "с ремонтом" : idn.repairState === "no" ? "без ремонта" : null,
    idn.segment === "primary" ? "новостройка" : idn.segment === "secondary" ? "вторичка" : null,
    idn.landHa ? `${idn.landHa} га` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const refuse = (reason) => {
    const rated = rateSample({
      used: 0,
      kind: idn.kind === "unknown" ? "apartment" : idn.kind,
      districtKnown,
      areaKnown: Boolean(area || idn.landHa),
      roomsKnown: Boolean(rooms),
    });
    return estateShell(idn, {
      fetchedAt,
      marketStatusReasonRu: reason,
      marketStatusReasonAz: "Kifayət qədər müqayisəli elan yoxdur.",
      error: reason,
      evidence: buildEvidence({
        source: "Bina",
        objectText: lot.titleAz || lot.titleRu || "",
        identityText,
        found: 0,
        rejected: 0,
        used: 0,
        usedItems: [],
        priceStats: null,
        marketStatus: "insufficient",
      }),
      query: { ...idn, label: idn.label },
    });
  };

  if (idn.kind === "unknown") {
    return refuse("Тип объекта не определён. Чужой тип в оценку не подставляем.");
  }
  if (!cityId) {
    return refuse(
      idn.city
        ? `Для «${idn.city}» в подключённом каталоге bina.az нет своего города. Рынок Баку не подставляем и цену не назначаем.`
        : "Город не распознан. Рыночную цену не назначаем."
    );
  }
  if (!districtKnown) {
    return refuse(
      "Недостаточно сопоставимых объектов: район не определён, весь Баку в оценку не подмешиваем."
    );
  }
  if (idn.kind === "apartment" && (!area || !rooms)) {
    return refuse(
      "У квартиры нет площади или числа комнат. Без этого аналоги не сравниваем и цену не назначаем."
    );
  }
  if ((idn.kind === "house" || strict) && !area && !idn.landHa) {
    return refuse("Нет площади, чтобы сравнивать этот тип объекта. Цену не назначаем.");
  }

  let categoryId = BINA_CATEGORY.apartment;
  if (idn.kind === "house") categoryId = BINA_CATEGORY.house;
  else if (idn.kind === "commercial") categoryId = BINA_CATEGORY.office;
  else if (idn.kind === "land") categoryId = BINA_CATEGORY.land;

  const locationIds = locationIdsForPlace(idn.placeKey, idn.placeLabels);
  let areaFrom;
  let areaTo;
  if (idn.kind === "land" && idn.landHa) {
    const sot = idn.landHa * 100;
    areaFrom = Math.max(1, Math.round(sot * MARKET_RULES.landAreaLo));
    areaTo = Math.round(sot * MARKET_RULES.landAreaHi);
  } else if (area) {
    areaFrom = Math.max(10, Math.round(area * MARKET_RULES.areaLo));
    areaTo = Math.round(area * MARKET_RULES.areaHi);
  }

  const base = {
    cityId,
    categoryId,
    rooms: idn.kind === "apartment" ? rooms : undefined,
    areaFrom,
    areaTo,
    first: 24,
  };

  let foundRaw = [];
  let nearbyRaw = [];
  try {
    foundRaw = await searchBinaItems({
      ...base,
      locationIds: locationIds.length ? locationIds : undefined,
    });
    if (idn.kind === "apartment" || idn.kind === "house") {
      const wider = await searchBinaItems(base);
      const seen = new Set(foundRaw.map((i) => i.id));
      for (const item of wider) {
        if (matchesPlace(item, idn.placeLabels)) {
          if (!seen.has(item.id)) {
            foundRaw.push(item);
            seen.add(item.id);
          }
        } else if (!seen.has(item.id)) {
          nearbyRaw.push(item);
        }
      }
    }
  } catch (e) {
    console.error("[bina]", e);
    const denied = refuse(UNAVAILABLE_TEXT.ru);
    return {
      ...denied,
      marketStatus: "unavailable",
      marketStatusLabelRu: "Источник недоступен",
      marketStatusReasonRu: UNAVAILABLE_TEXT.ru,
      marketStatusReasonAz: UNAVAILABLE_TEXT.az,
      marketStatusReasonEn: UNAVAILABLE_TEXT.en,
      error: UNAVAILABLE_TEXT.ru,
    };
  }

  const rejected = [];
  const candidates = [];
  for (const item of foundRaw) {
    if (!matchesPlace(item, idn.placeLabels)) {
      rejected.push(tagReject(item, "other_district"));
      continue;
    }
    if (idn.kind === "apartment") {
      if (item.rooms == null) {
        rejected.push(tagReject(item, "rooms_missing"));
        continue;
      }
      if (!roomsClose(item.rooms, rooms)) {
        rejected.push(tagReject(item, "rooms_far"));
        continue;
      }
      if (
        Number.isFinite(idn.floor) &&
        Number.isFinite(Number(item.floor)) &&
        Math.abs(Number(item.floor) - idn.floor) >= 8
      ) {
        rejected.push(tagReject(item, "floor_far"));
        continue;
      }
    }
    if (item.updatedAt) {
      const age = Date.now() - Date.parse(item.updatedAt);
      if (Number.isFinite(age) && age > 270 * 24 * 60 * 60 * 1000) {
        rejected.push(tagReject(item, "stale"));
        continue;
      }
    }
    if (idn.repairState === "yes" && item.hasRepair === false) {
      rejected.push(tagReject(item, "repair_mismatch"));
      continue;
    }
    if (idn.repairState === "no" && item.hasRepair === true) {
      rejected.push(tagReject(item, "repair_mismatch"));
      continue;
    }
    if (idn.kind === "land") {
      if (!item.areaSqm) {
        rejected.push(tagReject(item, "area_missing"));
        continue;
      }
      if (!landAreaClose(item.areaSqm, idn.landHa)) {
        rejected.push(tagReject(item, "area_far"));
        continue;
      }
    } else if (area) {
      if (!item.areaSqm) {
        rejected.push(tagReject(item, "area_missing"));
        continue;
      }
      if (!areaClose(item.areaSqm, area)) {
        rejected.push(tagReject(item, "area_far"));
        continue;
      }
    }
    candidates.push(item);
  }

  const outliers = applyPriceOutliers(candidates);
  rejected.push(...outliers.rejected);
  const rated = rateSample({
    used: outliers.kept.length,
    kind: idn.kind,
    districtKnown: true,
    areaKnown: Boolean(area || idn.landHa),
    roomsKnown: idn.kind !== "apartment" || Boolean(rooms),
  });
  const publish = rated.marketStatus !== "insufficient";
  const priceStats = publish ? summarizePrices(outliers.kept) : null;
  const nearbyNoteRu = nearbyRaw.length
    ? `Точных аналогов в районе: ${outliers.kept.length}. Дополнительно найдено ${nearbyRaw.length} объектов в других районах. Они НЕ использованы для основной оценки.`
    : outliers.kept.length < (strict ? 4 : 3)
      ? "Недостаточно сопоставимых объектов в выбранном районе."
      : null;

  return {
    ok: publish,
    marketStatus: rated.marketStatus,
    marketStatusLabelRu: statusLabel(rated.marketStatus),
    marketStatusReasonRu: publish
      ? rated.marketStatusReasonRu
      : idn.district
        ? `Недостаточно сопоставимых объектов в выбранном районе (${idn.district}).`
        : rated.marketStatusReasonRu,
    marketStatusReasonAz: rated.marketStatusReasonAz,
    marketStatusReasonEn: rated.marketStatusReasonEn,
    source: "bina.az",
    fetchedAt,
    identity: idn,
    query: {
      ...idn,
      label: idn.label,
      areaFrom,
      areaTo,
      locationIds,
      categoryId,
      districtLocked: true,
    },
    counts: {
      found: foundRaw.length,
      accepted: outliers.kept.length,
      rejected: rejected.length,
      used: publish ? outliers.kept.length : 0,
      nearby: nearbyRaw.length,
    },
    comps: outliers.kept,
    rejected,
    nearby: nearbyRaw.slice(0, 12),
    nearbyNoteRu,
    nearbyNoteAz: nearbyRaw.length
      ? `Rayonda dəqiq analoq: ${outliers.kept.length}. Digər rayonlarda əlavə ${nearbyRaw.length} elan tapılıb. Əsas qiymətə DAXİL DEYİL.`
      : null,
    evidence: buildEvidence({
      source: "Bina",
      objectText: lot.titleAz || lot.titleRu || "",
      identityText,
      found: foundRaw.length,
      rejected: rejected.length,
      used: publish ? outliers.kept.length : 0,
      usedItems: publish ? outliers.kept : [],
      priceStats,
      marketStatus: rated.marketStatus,
    }),
    outlierRule: outliers.fence,
    stats: publish
      ? {
          ...priceStats,
          medianPerSqm: medianPerSqm(outliers.kept),
          usableForValuation: rated.usableForValuation,
          fetchedAt,
          source: "bina.az",
          district: idn.district,
        }
      : null,
    error: publish
      ? null
      : `Недостаточно сопоставимых объектов в выбранном районе${idn.district ? ` (${idn.district})` : ""}.`,
    warnings: nearbyRaw.length
      ? [
          {
            level: "med",
            ru: nearbyNoteRu,
            az: `Digər rayonların elanları əsas qiymətə daxil deyil.`,
          },
        ]
      : [],
  };
}
