/**
 * Парсинг недвижимости из herrac (title + params).
 * Нужен, когда sectionData пустой или неполный.
 */

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
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function num(v) {
  if (v == null || v === "") return null;
  const n = Number(String(v).replace(",", ".").replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function pickParam(params, keys) {
  if (!params || typeof params !== "object") return "";
  for (const k of keys) {
    if (params[k] != null && params[k] !== "") return String(params[k]);
  }
  return "";
}

/** Районы / посёлки Баку → ключи для bina location match */
export const BAKU_PLACE_ALIASES = [
  { key: "nesimi", labels: ["nəsimi", "nesimi"], kind: "rayon" },
  { key: "yasamal", labels: ["yasamal"], kind: "rayon" },
  { key: "nizami", labels: ["nizami"], kind: "rayon" },
  { key: "nerimanov", labels: ["nərimanov", "nerimanov"], kind: "rayon" },
  { key: "xetai", labels: ["xətai", "xetai"], kind: "rayon" },
  { key: "sebail", labels: ["səbail", "sebail"], kind: "rayon" },
  { key: "sabuncu", labels: ["sabunçu", "sabuncu"], kind: "rayon" },
  { key: "suraxani", labels: ["suraxanı", "suraxani"], kind: "rayon" },
  { key: "bineqedi", labels: ["binəqədi", "bineqedi"], kind: "rayon" },
  { key: "qaradag", labels: ["qaradağ", "qaradag"], kind: "rayon" },
  { key: "xezer", labels: ["xəzər", "xezer"], kind: "rayon" },
  { key: "abseron", labels: ["abşeron", "abseron"], kind: "rayon" },
  { key: "bakixanov", labels: ["bakıxanov", "bakixanov"], kind: "qesebe" },
  { key: "ahmadli", labels: ["əhmədli", "ahmadli"], kind: "metro" },
  { key: "neftciler", labels: ["neftçilər", "neftciler"], kind: "metro" },
  { key: "elmlar", labels: ["elmlər", "elmlar akademiyasi"], kind: "metro" },
  { key: "28may", labels: ["28 may"], kind: "metro" },
  { key: "iceri", labels: ["içəri şəhər", "iceri seher"], kind: "metro" },
  { key: "badamdar", labels: ["badamdar"], kind: "qesebe" },
  { key: "lokbatan", labels: ["lökbatan", "lokbatan"], kind: "qesebe" },
  { key: "binagadi", labels: ["binəqədi q", "bineqedi q"], kind: "qesebe" },
  { key: "mardakan", labels: ["mərdəkan", "mardakan"], kind: "qesebe" },
  { key: "bina", labels: ["binə q", "bina q"], kind: "qesebe" },
  { key: "hovsan", labels: ["hövsan", "hovsan"], kind: "qesebe" },
  { key: "yeni_yasamal", labels: ["yeni yasamal"], kind: "qesebe" },
];

/**
 * @returns {{
 *   kind: 'apartment'|'house'|'land'|'commercial'|'unknown',
 *   city: string,
 *   district: string|null,
 *   placeKey: string|null,
 *   placeLabels: string[],
 *   areaSqm: number|null,
 *   rooms: number|null,
 *   floor: number|null,
 *   buildingType: string|null,
 *   condition: string|null,
 *   landHa: number|null,
 *   landSqm: number|null,
 *   label: string,
 * }}
 */
export function parseEstateIdentity(lot = {}) {
  const params = lot.params || lot.payload?.params || {};
  const title = String(lot.titleAz || lot.titleRu || "");
  const notes = String(lot.notes || lot.payload?.notes || "");
  const blob = `${title}\n${notes}\n${Object.entries(params)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n")}`;
  const folded = fold(blob);

  let kind = "unknown";
  const market = lot.market || "";
  if (/qeyri[\s-]*yasayis|ofis|magaza/.test(folded)) kind = "commercial";
  else if (/ferdi yasayis evi|heyet evi|bag evi/.test(folded)) kind = "house";
  else if (/menzil|kvartira/.test(folded)) kind = "apartment";
  else if (market === "land" || /torpaq sah/.test(folded)) kind = "land";
  else if (market === "commercial") kind = "commercial";
  else if (market === "estate") kind = "apartment";

  const cityRaw =
    pickParam(params, [
      "Əmlakın yerləşdiyi şəhər və ya rayon",
      "Şəhər",
      "City",
    ]) ||
    lot.cityAz ||
    lot.cityRu ||
    "";

  let city = cityRaw;
  const cityFromTitle = title.match(
    /Bakı|Baku|Sumqayıt|Gəncə|Naxçıvan|Şirvan|Mingəçevir|Lənkəran|Şəki|Yevlax|Hacıqabul|Cəlilabad|Ağstafa|Masallı|Şabran/i
  );
  if (!city && cityFromTitle) city = cityFromTitle[0];

  const namedCity = [
    [/xirdalan/, "Xırdalan"],
    [/sumqayit/, "Sumqayıt"],
    [/yevlax/, "Yevlax"],
    [/gence/, "Gəncə"],
    [/sirvan/, "Şirvan"],
    [/mingecevir/, "Mingəçevir"],
  ].find(([pattern]) => pattern.test(folded));
  if (namedCity?.[1] === "Xırdalan" || (namedCity && !/baki|baku/.test(fold(city)))) {
    city = namedCity[1];
  }

  let areaSqm =
    num(lot.areaSqm) ||
    num(lot.payload?.areaSqm) ||
    num(params["Sahəsi(m2)"]) ||
    num(params["Sahəsi (m2)"]) ||
    num(params["Sahə (m2)"]);

  // из текста «83.7 m2» / «83,7 м²»
  if (areaSqm == null) {
    const m = blob.match(/(\d+[.,]\d+|\d+)\s*(?:m2|m²|м2|м²)/i);
    if (m) areaSqm = num(m[1]);
  }

  let rooms =
    num(lot.rooms) ||
    num(lot.payload?.rooms) ||
    num(params["Otaq sayı"]) ||
    num(params["Otaq"]);

  if (rooms == null) {
    const m = blob.match(/(\d+)\s*otaq/i) || blob.match(/(\d+)\s*комн/i);
    if (m) rooms = num(m[1]);
  }

  const floor =
    num(lot.floor) ||
    num(lot.payload?.floor) ||
    num(params["Mərtəbəsi"]) ||
    num(params["Mərtəbə"]);

  const buildingType =
    params["Tikilinin növü"] || lot.payload?.buildingType || null;
  const condition = params["Vəziyyəti"] || lot.payload?.condition || null;
  let repairState = null;
  if (/temirsiz|təmirsiz|без ремонта/.test(folded)) repairState = "no";
  else if (/temirli|təmirli|евроремонт|temir olunub/.test(folded)) repairState = "yes";
  let segment = null;
  if (/yeni tikili/.test(folded)) segment = "primary";
  else if (/kohne tikili|köhnə tikili/.test(folded)) segment = "secondary";

  let landHa =
    num(lot.payload?.landAreaHa) ||
    num(params["Torpaq sahəsinin ölçüsü (hektarla)"]) ||
    num(params["Torpaq sahəsi (ha)"]);

  if (landHa == null) {
    const m = blob.match(/(\d+[.,]\d+|\d+)\s*ha\b/i);
    if (m) landHa = num(m[1]);
  }
  const landSqm =
    landHa != null
      ? Math.round(landHa * 10000 * 100) / 100
      : num(lot.payload?.landAreaSqm);

  // район / посёлок — только если город Bakı (иначе «Nizami» в Gəncə ≠ bina Bakı)
  let placeKey = null;
  let placeLabels = [];
  let district = null;
  const address =
    pickParam(params, ["Əmlakın yerləşdiyi ünvan", "Ünvan"]) || title;
  const isBaku =
    city !== "Xırdalan" &&
    (/bakı|baki|baku/i.test(city) || /bakı şəhəri/i.test(title));

  if (isBaku) {
    const places = [...BAKU_PLACE_ALIASES].sort(
      (a, b) =>
        Math.max(...b.labels.map((l) => l.length)) -
        Math.max(...a.labels.map((l) => l.length))
    );
    for (const p of places) {
      if (
        p.labels.some(
          (l) => fold(address).includes(fold(l)) || folded.includes(fold(l))
        )
      ) {
        placeKey = p.key;
        placeLabels = p.labels;
        district = p.labels[0];
        break;
      }
    }
  }

  const rayonMatch = address.match(
    /([A-Za-zА-Яа-яЁёİıƏəÖöÜüĞğŞşÇç\s]+?)\s+rayonu/i
  );
  if (rayonMatch && !district) {
    district = rayonMatch[1].trim();
    placeLabels = [district, fold(district)];
  }

  const qesebeMatch = address.match(
    /([A-Za-zА-Яа-яЁёİıƏəÖöÜüĞğŞşÇç\s]+?)\s+qəsəbəsi/i
  );
  if (qesebeMatch) {
    const q = qesebeMatch[1].trim();
    placeLabels = [...new Set([q, ...placeLabels])];
    if (!district) district = q;
  }

  const labelParts = [];
  if (kind === "apartment") labelParts.push(rooms ? `${rooms} otaq` : "mənzil");
  if (kind === "house") labelParts.push("həyət evi");
  if (kind === "land")
    labelParts.push(landHa ? `${landHa} ha` : "torpaq");
  if (kind === "commercial") labelParts.push("qeyri-yaşayış");
  if (areaSqm) labelParts.push(`~${areaSqm} m²`);
  if (district) labelParts.push(district);
  else if (city) labelParts.push(city);

  return {
    kind,
    city: city || "",
    district,
    placeKey,
    placeLabels,
    areaSqm,
    rooms,
    floor,
    buildingType,
    condition,
    repairState,
    segment,
    landHa,
    landSqm,
    label: labelParts.filter(Boolean).join(" · "),
  };
}
