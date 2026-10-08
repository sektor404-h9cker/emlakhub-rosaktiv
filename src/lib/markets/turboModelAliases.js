/**
 * Резолв модели → turbo.az model id.
 * Источник: turboModels.json (каталог с turbo.az) + шасси-алиасы (VAZ и т.п.).
 */
import TURBO_MAKES from "./turboMakes.json";
import TURBO_MODELS from "./turboModels.json";

const MAKE_ALIASES = {
  vaz: "lada",
  ваз: "lada",
  лада: "lada",
  "lada (vaz)": "lada",
  mb: "mercedes",
  "mercedes-benz": "mercedes",
  mercedesbenz: "mercedes",
  benz: "mercedes",
  vw: "volkswagen",
  "landrover": "land rover",
  "range rover": "land rover",
  "great wall": "gwm",
  "gwm (great wall motor)": "gwm",
};

/** Заводские коды → рыночное имя (когда на turbo другое название) */
const CHASSIS_ALIASES = [
  {
    make: "lada",
    codes: ["21214", "21213", "2121", "2131", "21218", "2129"],
    display: "Niva",
    tokens: ["niva", "нива", "4x4"],
  },
  {
    make: "lada",
    codes: ["21043", "21041", "2104"],
    display: "2104",
    tokens: ["2104"],
  },
  {
    make: "lada",
    codes: ["21074", "21073", "2107"],
    display: "2107",
    tokens: ["2107"],
  },
  {
    make: "lada",
    codes: ["21053", "21051", "2105"],
    display: "2105",
    tokens: ["2105"],
  },
  {
    make: "lada",
    codes: ["21061", "21063", "2106"],
    display: "2106",
    tokens: ["2106"],
  },
  {
    make: "lada",
    codes: ["2108", "21081", "21083"],
    display: "2108",
    tokens: ["2108"],
  },
  {
    make: "lada",
    codes: ["2109", "21093", "21099"],
    display: "2109",
    tokens: ["2109"],
  },
  {
    make: "lada",
    codes: ["2110", "21101", "21102"],
    display: "2110",
    tokens: ["2110"],
  },
  {
    make: "lada",
    codes: ["2114", "21144"],
    display: "2114",
    tokens: ["2114"],
  },
  {
    make: "lada",
    codes: ["2115", "21150"],
    display: "2115",
    tokens: ["2115"],
  },
  {
    make: "lada",
    codes: ["2170", "2172", "priora"],
    display: "Priora",
    tokens: ["priora", "приора"],
  },
  {
    make: "lada",
    codes: ["2190", "granta"],
    display: "Granta",
    tokens: ["granta", "гранта"],
  },
  {
    make: "kia",
    codes: ["borrego"],
    display: "Mohave",
    tokens: ["mohave", "borrego"],
  },
];

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
    .replace(/ç/g, "c")
    .replace(/ё/g, "e")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function compact(s) {
  return fold(s).replace(/[^a-z0-9]/g, "");
}

export function resolveMakeKey(make) {
  let key = fold(make).replace(/\s+/g, " ").trim();
  if (MAKE_ALIASES[key]) key = MAKE_ALIASES[key];
  if (TURBO_MAKES[key]) return key;
  // "lada (vaz)" style
  for (const [name, id] of Object.entries(TURBO_MAKES)) {
    if (!/^[a-zа-яёıəöğüşç\s()&/-]+$/i.test(name)) continue;
    if (name.length < 2) continue;
    if (name === key || name.includes(key) || key.includes(name)) {
      if (/^\d+$/.test(name)) continue;
      return name;
    }
  }
  if (/vaz|lada|ваз|лада/.test(key)) return "lada";
  if (/mercedes|benz|\bmb\b/.test(key)) return "mercedes";
  if (/^bmw/.test(key)) return "bmw";
  if (/volkswagen|\bvw\b/.test(key)) return "volkswagen";
  if (/land\s*rover|range\s*rover/.test(key)) return "land rover";
  return key;
}

export function resolveMakeId(make) {
  const key = resolveMakeKey(make);
  if (!key) return null;
  if (TURBO_MAKES[key]) return String(TURBO_MAKES[key]);
  if (TURBO_MAKES[fold(make)]) return String(TURBO_MAKES[fold(make)]);
  return null;
}

function modelsForMake(makeId) {
  return TURBO_MODELS[String(makeId)] || [];
}

function scoreCatalogHit(queryCompact, catalogName) {
  const c = compact(catalogName);
  if (!queryCompact || !c) return 0;
  if (queryCompact === c) return 1000 + c.length;
  // «21043» → «2104», «528i» → «528»
  if (queryCompact.startsWith(c) && c.length >= 3) return 800 + c.length * 2;
  if (c.startsWith(queryCompact) && queryCompact.length >= 3)
    return 700 + queryCompact.length * 2;
  // «xc90» in «xc90», «landcruiser» vs «land cruiser»
  if (queryCompact.includes(c) && c.length >= 3) return 500 + c.length;
  if (c.includes(queryCompact) && queryCompact.length >= 3)
    return 400 + queryCompact.length;
  return 0;
}

function pickBestModel(makeId, modelRaw) {
  const list = modelsForMake(makeId);
  if (!list.length || !modelRaw) return null;

  let q = fold(modelRaw).trim();
  // BMW 528İ / 528i / 530d → цифровая база
  q = q.replace(/\b(\d{2,3})[a-zа-я]{0,3}\b/gi, "$1");
  // XC-90 → xc90
  const qCompact = compact(q);
  if (!qCompact) return null;

  let best = null;
  let bestScore = 0;
  for (const m of list) {
    const sc = scoreCatalogHit(qCompact, m.name);
    if (sc > bestScore) {
      bestScore = sc;
      best = m;
    }
  }
  // порог: короткий шум («a», «x») не матчим
  if (!best || bestScore < 400) return null;
  return best;
}

function chassisHit(makeKey, modelRaw) {
  const mk = fold(makeKey);
  const compactModel = compact(modelRaw);
  if (!compactModel) return null;
  for (const a of CHASSIS_ALIASES) {
    if (a.make !== mk) continue;
    const hit = a.codes.some((c) => {
      const cc = compact(c);
      return (
        compactModel === cc ||
        compactModel.startsWith(cc) ||
        (cc.length >= 4 && cc.startsWith(compactModel))
      );
    });
    if (hit) return a;
  }
  return null;
}

/**
 * @returns {{ display: string, tokens: string[], turboModelId: string|null, code: string, makeId: string|null } | null}
 */
export function resolveModelAlias(make, model) {
  const makeKey = resolveMakeKey(make);
  const makeId = resolveMakeId(make);
  const raw = String(model || "")
    .replace(/minik|markalı|nəqliyyat|vasitəsi|avtomobil|texnika/gi, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!raw && !makeId) return null;

  // 1) шасси-алиас (VAZ 21214 → Niva)
  const chassis = chassisHit(makeKey, raw);
  let searchName = raw;
  let tokens = [];
  let code = raw;

  if (chassis) {
    searchName = chassis.display;
    tokens = chassis.tokens || [];
    code = raw;
  }

  // 2) точный id из каталога turbo
  const hit = makeId ? pickBestModel(makeId, searchName) : null;
  if (hit) {
    return {
      display: hit.name,
      tokens: [
        ...new Set([
          ...tokens,
          compact(hit.name),
          fold(hit.name),
          ...fold(hit.name).split(/[\s/-]+/).filter(Boolean),
        ]),
      ],
      turboModelId: String(hit.id),
      code,
      makeId: String(makeId),
    };
  }

  if (chassis) {
    return {
      display: chassis.display,
      tokens: chassis.tokens,
      turboModelId: null,
      code,
      makeId: makeId ? String(makeId) : null,
    };
  }

  if (!raw) return null;

  return {
    display: raw,
    tokens: [compact(raw), fold(raw)].filter(Boolean),
    turboModelId: null,
    code: raw,
    makeId: makeId ? String(makeId) : null,
  };
}

export { MAKE_ALIASES, CHASSIS_ALIASES, fold, compact };
