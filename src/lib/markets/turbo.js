/**
 * turbo.az comps — та же марка/модель, без чужих авто.
 * Парсим herrac-заголовки → каталог turboModels.json → q[make]/q[model].
 */
import { marketFetch } from "./http";
import {
  UNAVAILABLE_TEXT,
  YEAR_ACCEPT,
  applyPriceOutliers,
  buildEvidence,
  mileageIsClose,
  rateSample,
  summarizePrices,
  tagReject,
} from "./engine";
import { MARKET_RULES } from "../productRules";
import TURBO_MAKES from "./turboMakes.json";
import {
  resolveModelAlias,
  resolveMakeId,
  resolveMakeKey,
  fold,
  compact,
  MAKE_ALIASES,
} from "./turboModelAliases";

export { TURBO_MAKES };

const QUOTE_RE = /["«»„“”‘’ˈ']/g;

/**
 * Извлекает make/model из типичных заголовков herrac:
 *   Avtomobil - "Kia Mohave" markalı...
 *   Avtomobil - VAZ 21214" minik markalı...
 *   Nəqliyyat vasitəsi - "Volvo XC-90" minik...
 *   Avtomobil - "BMW 528İ” markalı...
 *   Avtomobil - Ford Fusion minik markalı...
 */
export function parseAutoIdentity(title = "", params = {}) {
  let t = String(title || "")
    .replace(/^Avtomobil\s*[-–—:]?\s*/i, "")
    .replace(/^Nəqliyyat\s+vasitəsi\s*[-–—:]?\s*/i, "")
    .replace(/^Транспортное\s+средство\s*[-–—:]?\s*/i, "")
    .replace(/^Texnika\s*[-–—:]?\s*/i, "")
    .trim();

  // Обрезать хвост после markalı / dövlət / nişanlı
  t = t
    .replace(/\s+markal[ıi].*$/i, "")
    .replace(/\s+dövlət\s+qeydiyyat.*$/i, "")
    .replace(/\s+nişanlı.*$/i, "")
    .replace(/,?\s*\d{4}\s*-?\s*ci\s*il.*$/i, "")
    .trim();

  // Кавычки: "Kia Mohave" / "BMW 528İ"
  const quoted = t.match(/["«„“‘]([^"»”“’]+)["»”“’]/);
  if (quoted) {
    t = quoted[1].trim();
  } else {
    t = t.replace(QUOTE_RE, " ").replace(/\s+/g, " ").trim();
  }

  // Убрать (VAZ) в скобках рядом с Lada
  t = t.replace(/\(\s*(vaz|ваз|lada)\s*\)/gi, " ").replace(/\s+/g, " ").trim();

  const fromParams = pickParam(params, [
    "Marka",
    "marka",
    "Make",
    "Avtomobilin markası",
    "Markası",
  ]);
  const modelParam = pickParam(params, [
    "Model",
    "model",
    "Avtomobilin modeli",
    "Modeli",
  ]);

  // Двухсловные марки
  const twoWord = matchTwoWordMake(t);
  if (twoWord) {
    return {
      make: displayMake(twoWord.make),
      model: normalizeModel(twoWord.model),
    };
  }

  // MAKE-MODEL / MAKE MODEL
  const glued = t.match(
    /^([A-Za-zА-Яа-яЁёİıƏəÖöÜüĞğŞşÇç]+)\s*[-–—]\s*(.+)$/i
  );
  if (glued) {
    return {
      make: displayMake(glued[1]),
      model: normalizeModel(glued[2]),
    };
  }

  const parts = t.split(/[\s,]+/).filter(Boolean);
  if (parts.length >= 2) {
    return {
      make: displayMake(parts[0]),
      model: normalizeModel(parts.slice(1).join(" ")),
    };
  }

  if (fromParams) {
    return {
      make: displayMake(fromParams),
      model: normalizeModel(modelParam || parts[0] || ""),
    };
  }

  if (parts[0]) {
    return { make: displayMake(parts[0]), model: "" };
  }

  return { make: "", model: "" };
}

function pickParam(params, keys) {
  if (!params || typeof params !== "object") return "";
  for (const k of keys) {
    if (params[k]) return String(params[k]);
  }
  return "";
}

function matchTwoWordMake(t) {
  const low = fold(t);
  const pairs = [
    ["land rover", "land rover"],
    ["range rover", "land rover"],
    ["alfa romeo", "alfa romeo"],
    ["great wall", "gwm"],
    ["li auto", "li auto"],
    ["ssang yong", "ssang yong"],
    ["iran khodro", "iran khodro"],
  ];
  for (const [prefix, makeKey] of pairs) {
    if (low.startsWith(prefix + " ") || low === prefix) {
      const rest = t.slice(prefix.length).trim();
      return { make: makeKey, model: rest };
    }
  }
  return null;
}

function displayMake(m) {
  const key = resolveMakeKey(m);
  if (key === "lada") return "Lada";
  if (key === "mercedes") return "Mercedes";
  if (key === "volkswagen") return "Volkswagen";
  if (key === "bmw") return "BMW";
  if (key === "land rover") return "Land Rover";
  if (!key) return String(m || "").trim();
  // Title-case from key
  return key
    .split(" ")
    .map((w) => (w.length <= 3 && w === w.toUpperCase() ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function normalizeModel(m) {
  return String(m || "")
    .replace(/minik|markalı|nəqliyyat|vasitəsi|avtomobil|texnika/gi, "")
    .replace(QUOTE_RE, "")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function modelTokens(model, alias) {
  const raw = normalizeModel(model).toLowerCase();
  const fromAlias = alias?.tokens || [];
  if (!raw && !fromAlias.length) return [];
  const c = compact(raw);
  const parts = fold(raw).split(/[-\s/]+/).filter((t) => t.length > 0);
  return [
    ...new Set(
      [raw, c, ...parts, ...fromAlias, alias?.display ? fold(alias.display) : null]
        .filter(Boolean)
        .map((t) => String(t).toLowerCase())
        .filter((t) => t.length > 1)
    ),
  ];
}

function nameMatchesMake(name, make) {
  const n = fold(name);
  const m = fold(make);
  if (!m) return false;
  if (n.includes(m)) return true;
  const key = resolveMakeKey(make);
  if (key === "lada") return /lada|vaz|ваз|лада/.test(n);
  if (key === "mercedes") return /mercedes/.test(n);
  if (key === "land rover") return /land rover|range rover/.test(n);
  if (key === "volkswagen") return /volkswagen|\bvw\b/.test(n);
  if (MAKE_ALIASES[m]) return n.includes(MAKE_ALIASES[m]);
  return false;
}

export function nameMatchesModel(name, model, alias) {
  const n = compact(name);
  const tokens = modelTokens(model, alias).filter((t) => compact(t).length >= 2);
  if (!tokens.length) return false;
  return tokens.some((tok) => {
    const c = compact(tok);
    return c.length >= 2 && n.includes(c);
  });
}

function litersOf(text) {
  const s = String(text || "");
  const cc = s.match(/(\d{3,4})(?:\.0+)?\s*(?:sm3|sm³|см3|cc|cm3)?/i);
  if (cc) {
    const raw = Number(cc[1]);
    const looksLikeYear = raw >= 1950 && raw <= 2035;
    if (!looksLikeYear && raw > 500 && raw < 8000) {
      return Math.round((raw / 1000) * 10) / 10;
    }
  }
  const l = s.match(/(\d+[.,]\d+|\d+)\s*(?:l|л)\b/i);
  if (l) {
    const n = Number(l[1].replace(",", "."));
    return n > 0.4 && n < 9 ? n : null;
  }
  return null;
}

function parseCards(html) {
  const parts = String(html || "").split("products-i__link").slice(1);
  const out = [];
  for (const p of parts) {
    const href = (p.match(/href="(\/autos\/\d+-[^"]+)"/) || [])[1];
    if (!href || href.includes("bookmarks")) continue;
    const name = (p.match(/products-i__name[^>]*>\s*([^<]+)/) || [])[1]?.trim();
    const priceRaw = (p.match(/products-i__price[^>]*>\s*([\d\s]+)/) || [])[1];
    const price = priceRaw ? Number(priceRaw.replace(/\s/g, "")) : null;
    const attrs =
      (p.match(/products-i__attributes[^>]*>\s*([^<]+)/) || [])[1]?.trim() ||
      "";
    const place =
      (p.match(/products-i__datetime[^>]*>\s*([^<]+)/) || [])[1]?.trim() || "";
    const [yearStr, engine, kmStr] = attrs.split(",").map((s) => s.trim());
    const year = yearStr ? Number(yearStr) : null;
    const mileageKm = kmStr
      ? Number(String(kmStr).replace(/[^\d]/g, ""))
      : null;
    if (!name || !price) continue;
    out.push({
      source: "turbo",
      id: (href.match(/\/autos\/(\d+)/) || [])[1] || href,
      url: `https://turbo.az${href}`,
      name,
      price,
      year: Number.isFinite(year) ? year : null,
      engine: engine || null,
      mileageKm: Number.isFinite(mileageKm) ? mileageKm : null,
      place,
      attrs,
    });
  }
  const map = new Map();
  for (const c of out) if (!map.has(c.id)) map.set(c.id, c);
  return [...map.values()];
}

/**
 * @param {{ make?: string, model?: string, year?: number|null, yearFrom?: number, yearTo?: number }} q
 */
export async function searchTurboAutos(q = {}) {
  const makeId = resolveMakeId(q.make);
  if (!makeId) {
    return {
      url: null,
      cards: [],
      makeId: null,
      error: `Марку «${q.make || "—"}» на turbo.az не нашли`,
    };
  }

  const alias = resolveModelAlias(q.make, q.model);
  if (!alias?.turboModelId) {
    return {
      url: null,
      cards: [],
      makeId,
      alias,
      modelResolved: false,
      error: `Точная модель «${q.make || ""} ${q.model || ""}» на turbo.az не определена. Поиск по марке целиком не делаем.`,
    };
  }

  const yearNum = Number(q.year);
  const yearOk = Number.isFinite(yearNum) && yearNum > 1950;
  const pad = q.yearPad ?? MARKET_RULES.yearFetchPad;
  const yearFrom = q.yearFrom ?? (yearOk ? Math.max(1980, yearNum - pad) : null);
  const yearTo = q.yearTo ?? (yearOk ? Math.min(2030, yearNum + pad) : null);

  const params = new URLSearchParams();
  params.append("q[make][]", makeId);
  params.append("q[model][]", String(alias.turboModelId));
  if (yearFrom) params.set("q[year_from]", String(yearFrom));
  if (yearTo) params.set("q[year_to]", String(yearTo));

  const url = `https://turbo.az/autos?${params}`;
  const html = await marketFetch(url, {
    headers: { Referer: "https://turbo.az/" },
  });
  const cards = parseCards(html);

  return {
    url,
    cards,
    makeId,
    alias,
    modelResolved: true,
    error: cards.length ? null : `На turbo.az нет объявлений: ${q.make} ${alias.display}`,
  };
}

function lotYear(lot, params, title) {
  const direct = Number(lot.year || lot.payload?.year || params["Buraxılış ili"]);
  if (Number.isFinite(direct) && direct > 1950) return direct;
  const m = String(title || "").match(/\b(19|20)\d{2}\b/);
  return m ? Number(m[0]) : null;
}

function lotMileage(lot, params) {
  const direct = Number(
    lot.mileageKm ||
      lot.payload?.mileageKm ||
      params["Yürüş"] ||
      params["Yürüş (km)"] ||
      params["Пробег"]
  );
  return Number.isFinite(direct) && direct > 0 ? direct : null;
}

function lotEngine(params, notes) {
  const blob = [
    params["Mühərrikin həcmi"],
    params["Mühərrik"],
    params["Mühərrikin gücü"],
    notes,
  ]
    .filter(Boolean)
    .join(" ");
  return litersOf(blob);
}

export async function compsForAutoLot(lot) {
  const title = lot.titleAz || lot.titleRu || "";
  const params = lot.params || lot.payload?.params || {};
  const notes = lot.notes || lot.payload?.notes || "";
  const idn = parseAutoIdentity(title, params);
  const alias = resolveModelAlias(idn.make, idn.model);
  const year = lotYear(lot, params, title);
  const mileage = lotMileage(lot, params);
  const engineLiters = lotEngine(params, notes);
  const fetchedAt = new Date().toISOString();
  const modelResolved = Boolean(alias?.turboModelId);
  const labelCore = alias?.display
    ? `${idn.make} ${alias.display}`
    : `${idn.make} ${idn.model}`.trim();
  const labelHint =
    alias?.code && compact(alias.code) !== compact(alias?.display || "")
      ? `${labelCore} · код ${alias.code}`
      : labelCore;

  const identityText = [
    labelHint || "модель не определена",
    year ? String(year) : "год неизвестен",
    mileage ? `пробег ${mileage.toLocaleString("en-US")} км` : "пробег неизвестен",
    engineLiters ? `двигатель ${engineLiters} л` : null,
  ]
    .filter(Boolean)
    .join(", ");

  const query = {
    ...idn,
    year,
    mileageKm: mileage,
    engineLiters,
    label: labelHint,
    alias: alias?.display || null,
    turboModelId: alias?.turboModelId || null,
    modelResolved,
  };

  if (!idn.make || !String(idn.model || "").trim() || !modelResolved) {
    const rated = rateSample({
      used: 0,
      kind: "auto",
      modelResolved: false,
    });
    return emptyAuto(lot, query, fetchedAt, identityText, rated, 
      "Недостаточно данных: точная модель не определена. Другие модели этой марки в оценку не берём."
    );
  }

  let result;
  try {
    result = await searchTurboAutos({
      make: idn.make,
      model: idn.model,
      year,
    });
  } catch (e) {
    console.error("[turbo]", e);
    const rated = rateSample({ used: 0, kind: "auto", modelResolved: true, yearKnown: Boolean(year), mileageKnown: Boolean(mileage) });
    return {
      ...emptyAuto(lot, query, fetchedAt, identityText, rated, UNAVAILABLE_TEXT.ru),
      marketStatus: "unavailable",
      marketStatusLabelRu: "Источник недоступен",
      marketStatusReasonRu: UNAVAILABLE_TEXT.ru,
      marketStatusReasonAz: UNAVAILABLE_TEXT.az,
      marketStatusReasonEn: UNAVAILABLE_TEXT.en,
      error: UNAVAILABLE_TEXT.ru,
    };
  }

  query.searchUrl = result.url;
  const foundCards = result.cards || [];
  if (!year) {
    const reason =
      "Год автомобиля в карточке Hərrac не указан. Без него близкий год не отобрать, рыночную цену не даём.";
    return {
      ok: false,
      marketStatus: "insufficient",
      marketStatusLabelRu: "Недостаточно данных",
      marketStatusReasonRu: reason,
      marketStatusReasonAz: "Lotda il yoxdur. Yaxın ili seçmək olmur, bazar qiyməti vermirik.",
      source: "turbo.az",
      fetchedAt,
      identity: { ...idn, year: null, mileageKm: mileage, engineLiters, label: labelHint },
      query,
      counts: { found: foundCards.length, accepted: 0, rejected: 0, used: 0 },
      comps: [],
      foundPreview: foundCards.slice(0, 12).map((c) => ({
        id: c.id,
        name: c.name,
        price: c.price,
        year: c.year,
        mileageKm: c.mileageKm,
        url: c.url,
      })),
      rejected: [],
      nearby: [],
      nearbyNoteRu: null,
      evidence: buildEvidence({
        source: "Turbo",
        objectText: title,
        identityText,
        found: foundCards.length,
        rejected: 0,
        used: 0,
        usedItems: [],
        priceStats: null,
        marketStatus: "insufficient",
      }),
      outlierRule: null,
      stats: null,
      error: reason,
      warnings: [],
    };
  }

  const rejected = [];
  const candidates = [];

  for (const card of foundCards) {
    if (!nameMatchesMake(card.name, idn.make)) {
      rejected.push(tagReject(card, "other_make"));
      continue;
    }
    if (!nameMatchesModel(card.name, alias.display || idn.model, alias)) {
      rejected.push(tagReject(card, "other_model"));
      continue;
    }
    if (year) {
      if (!card.year) {
        rejected.push(tagReject(card, "year_missing"));
        continue;
      }
      if (Math.abs(card.year - year) > YEAR_ACCEPT) {
        rejected.push(tagReject(card, "year_far"));
        continue;
      }
    }
    if (mileage) {
      if (!card.mileageKm) {
        rejected.push(tagReject(card, "mileage_missing"));
        continue;
      }
      if (!mileageIsClose(mileage, card.mileageKm)) {
        rejected.push(tagReject(card, "mileage_far"));
        continue;
      }
    }
    if (engineLiters) {
      const cardL = litersOf(card.engine || card.attrs || card.name);
      if (cardL && Math.abs(cardL - engineLiters) > MARKET_RULES.engineLitersTolerance) {
        rejected.push(tagReject(card, "engine_mismatch"));
        continue;
      }
    }
    candidates.push(card);
  }

  const outliers = applyPriceOutliers(candidates);
  rejected.push(...outliers.rejected);

  const rated = rateSample({
    used: outliers.kept.length,
    kind: "auto",
    modelResolved: true,
    yearKnown: Boolean(year),
    mileageKnown: Boolean(mileage),
  });

  const publish = rated.marketStatus !== "insufficient";
  const priceStats = publish ? summarizePrices(outliers.kept) : summarizePrices([]);
  const evidence = buildEvidence({
    source: "Turbo",
    objectText: title,
    identityText,
    found: foundCards.length,
    rejected: rejected.length,
    used: publish ? outliers.kept.length : 0,
    usedItems: publish ? outliers.kept : [],
    priceStats,
    marketStatus: rated.marketStatus,
  });

  return {
    ok: publish,
    marketStatus: rated.marketStatus,
    marketStatusLabelRu: statusLabel(rated.marketStatus),
    marketStatusReasonRu: rated.marketStatusReasonRu,
    marketStatusReasonAz: rated.marketStatusReasonAz,
    marketStatusReasonEn: rated.marketStatusReasonEn,
    source: "turbo.az",
    fetchedAt,
    identity: { ...idn, year, mileageKm: mileage, engineLiters, label: labelHint },
    query,
    counts: {
      found: foundCards.length,
      accepted: outliers.kept.length,
      rejected: rejected.length,
      used: publish ? outliers.kept.length : 0,
    },
    comps: outliers.kept,
    rejected,
    nearby: [],
    nearbyNoteRu: null,
    evidence,
    outlierRule: outliers.fence,
    stats: publish
      ? {
          ...priceStats,
          usableForValuation: rated.usableForValuation,
          fetchedAt,
          source: "turbo.az",
        }
      : null,
    error: publish ? null : rated.marketStatusReasonRu,
    warnings: [
      {
        level: "high",
        ru: "В медиану входят только объявления той же модели после проверки года, пробега и выбросов.",
        az: "Mediana yalnız eyni modelin yoxlanılmış elanları daxildir.",
      },
    ],
  };
}

function statusLabel(status) {
  if (status === "high") return "Высокая";
  if (status === "medium") return "Средняя";
  if (status === "low") return "Низкая";
  return "Недостаточно данных";
}

function emptyAuto(lot, query, fetchedAt, identityText, rated, error) {
  const title = lot.titleAz || lot.titleRu || "";
  return {
    ok: false,
    marketStatus: "insufficient",
    marketStatusLabelRu: "Недостаточно данных",
    marketStatusReasonRu: rated.marketStatusReasonRu,
    marketStatusReasonAz: rated.marketStatusReasonAz,
    marketStatusReasonEn: rated.marketStatusReasonEn,
    source: "turbo.az",
    fetchedAt,
    identity: query,
    query,
    counts: { found: 0, accepted: 0, rejected: 0, used: 0 },
    comps: [],
    rejected: [],
    nearby: [],
    nearbyNoteRu: null,
    evidence: buildEvidence({
      source: "Turbo",
      objectText: title,
      identityText,
      found: 0,
      rejected: 0,
      used: 0,
      usedItems: [],
      priceStats: null,
      marketStatus: "insufficient",
    }),
    outlierRule: null,
    stats: null,
    error: error || rated.marketStatusReasonRu,
    warnings: [],
  };
}
