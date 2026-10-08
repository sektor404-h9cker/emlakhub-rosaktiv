import { money } from "./money";

function formatWhen(iso, locale = "ru") {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  try {
    return d.toLocaleString(locale === "az" ? "az-AZ" : locale === "en" ? "en-GB" : "ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

const PARAM_RU = {
  "Buraxılış ili": "Год",
  "Ban nömrəsi": "VIN / номер кузова",
  "Yürüş(km)": "Пробег",
  "Mühərrik": "Двигатель",
  "Yanacaq növü": "Топливо",
  "Sürətlər qutusu": "Коробка",
  "Ban növü": "Кузов",
  "Rəng": "Цвет",
  Yeni: "Новый",
  "Əmlakın yerləşdiyi ünvan": "Адрес",
  "Əmlakın yerləşdiyi şəhər və ya rayon": "Город",
  "Əlavə məlumat": "Дополнительно от Hərrac",
  "Əlavə qeyd": "Примечание Hərrac",
  "Sahəsi(m2)": "Площадь",
  "Otaq sayı": "Комнаты",
  Mərtəbəsi: "Этаж",
  "Tikilinin növü": "Тип здания",
  Vəziyyəti: "Состояние",
  "Hüquq müəyyən edici sənəd": "Документ",
  "Torpaq sahəsinin kateqoriyası": "Категория земли",
  "Torpaq sahəsinin ölçüsü (hektarla)": "Площадь земли",
  "Torpaq sahəsi (ha)": "Площадь земли",
  "Binanın mərtəbəliliyi": "Этажей в здании",
  Lift: "Лифт",
  "Əmlakın istifadə olunması barədə": "Использование",
};

const STATUS_RU = {
  NOT_STARTED: "Торги ещё не начались",
  PENDING: "Ожидание",
  ONGOING: "Торги идут",
  WINNER: "Победитель определён",
};

const STATUS_AZ = {
  NOT_STARTED: "Hərrac başlamayıb",
  PENDING: "Gözləmə",
  ONGOING: "Hərrac gedir",
  WINNER: "Qalib müəyyən olunub",
};

const ATTEND_RU = { COMPLETED: "Завершено", ONGOING: "Идёт", PENDING: "Ожидание" };
const ATTEND_AZ = { COMPLETED: "Bitib", ONGOING: "Gedir", PENDING: "Gözləmə" };
const STATUS_EN = {
  NOT_STARTED: "The auction has not started",
  PENDING: "Waiting",
  ONGOING: "Auction is live",
  WINNER: "A winner is set",
};
const ATTEND_EN = { COMPLETED: "Completed", ONGOING: "In progress", PENDING: "Waiting" };
const LABEL_EN = {
  Год: "Year",
  Госномер: "Plate",
  "VIN / номер кузова": "VIN / body number",
  Пробег: "Mileage",
  Двигатель: "Engine",
  Топливо: "Fuel",
  Коробка: "Gearbox",
  Кузов: "Body",
  Цвет: "Colour",
  Новый: "New",
  Адрес: "Address",
  Город: "City",
  Площадь: "Area",
  Комнаты: "Rooms",
  Этаж: "Floor",
  "Этажей в здании": "Storeys",
  Лифт: "Lift",
  Использование: "Use",
  Назначение: "Purpose",
  Состояние: "Condition",
  Документ: "Document",
  "Площадь земли": "Land area",
  "Цена лота": "Lot price",
  "Начальная цена": "Opening price",
  "Последняя ставка": "Last bid",
  Задаток: "Deposit",
  Сбор: "Fee",
  "Минимальный шаг": "Minimum step",
  "Максимальный шаг": "Maximum step",
  "Начало торгов": "Auction start",
  "Окончание торгов": "Auction end",
  Раунд: "Round",
  Статус: "Status",
  "Статус участия": "Attendance",
  Участники: "Bidders",
  "Категория Hərrac": "Hərrac category",
  "Ставок не было": "No bids",
  "Дополнительно от Hərrac": "Extra from Hərrac",
  "Примечание Hərrac": "Hərrac note",
  "Текст Hərrac": "Hərrac text",
  "Краткая строка Hərrac": "Short Hərrac line",
  "Точка на карте": "Map point",
  "Место нахождения": "Location",
  "Срок торгов": "Auction window",
};

const AUTO_HIGHLIGHTS = ["year", "mileage", "plate", "vin", "engine", "place", "when", "deposit", "note"];
const ESTATE_HIGHLIGHTS = ["place", "area", "rooms", "floor", "purpose", "titleDoc", "when", "deposit", "condition"];

function text(value) {
  if (value == null) return null;
  const s = String(value).trim();
  return s ? s : null;
}

function param(lot, name) {
  const bag = lot?.params;
  if (!bag || typeof bag !== "object") return null;
  return text(bag[name]);
}

function label(name, az) {
  if (az) return name;
  return PARAM_RU[name] || name;
}

function plateFromTitle(lot) {
  const title = [lot?.titleAz, lot?.titleRu, lot?.titleEn].filter(Boolean).join(" ");
  const match = title.match(/\b\d{2}-[A-Z]{2}-\d{3}\b/);
  return match ? match[0] : null;
}

function km(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return text(value);
  return `${Math.round(n).toLocaleString("ru-RU")} км`;
}

function sqm(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return text(value);
  return `${n.toLocaleString("ru-RU")} м²`;
}

function when(iso, locale) {
  const raw = text(iso);
  if (!raw) return null;
  return formatWhen(raw, locale) || raw;
}

function row(id, azLabel, ruLabel, value, extra) {
  const shown = text(value);
  if (!shown) return null;
  return { id, labelAz: azLabel, labelRu: ruLabel, labelEn: LABEL_EN[ruLabel] || ruLabel, value: shown, ...extra };
}

function moneyRow(id, azLabel, ruLabel, value) {
  if (value == null || value === "" || !Number.isFinite(Number(value))) return null;
  return row(id, azLabel, ruLabel, money(value));
}

/**
 * Только непустые поля, которые реально лежат на лоте.
 * Пустое поле в список не попадает.
 */
export function buildHerracFacts(lot, { az = false, locale = "ru" } = {}) {
  const auto = lot?.market === "auto" || lot?.market === "equipment";
  const place = param(lot, "Əmlakın yerləşdiyi ünvan") || text(lot?.districtAz);
  const city = param(lot, "Əmlakın yerləşdiyi şəhər və ya rayon") || text(lot?.cityAz);
  const year = param(lot, "Buraxılış ili") || text(lot?.year);
  const vin = param(lot, "Ban nömrəsi") || text(lot?.vin);
  const mileage = param(lot, "Yürüş(km)") || (lot?.mileageKm != null ? String(lot.mileageKm) : null);
  const engine = param(lot, "Mühərrik") || text(lot?.engine);
  const fuel = param(lot, "Yanacaq növü") || text(lot?.fuel);
  const gearbox = param(lot, "Sürətlər qutusu") || text(lot?.gearbox);
  const body = param(lot, "Ban növü") || text(lot?.bodyType);
  const color = param(lot, "Rəng") || text(lot?.color);
  const isNew = param(lot, "Yeni") || text(lot?.isNew);
  const area = param(lot, "Sahəsi(m2)") || (lot?.areaSqm != null ? String(lot.areaSqm) : null);
  const rooms = param(lot, "Otaq sayı") || (lot?.rooms != null ? String(lot.rooms) : null);
  const floor = param(lot, "Mərtəbəsi") || (lot?.floor != null ? String(lot.floor) : null);
  const building = param(lot, "Tikilinin növü") || text(lot?.buildingType);
  const condition = param(lot, "Vəziyyəti") || text(lot?.condition);
  const titleDoc = param(lot, "Hüquq müəyyən edici sənəd") || text(lot?.titleDoc);
  const landCategory = param(lot, "Torpaq sahəsinin kateqoriyası") || text(lot?.landCategory);
  const landHa =
    param(lot, "Torpaq sahəsinin ölçüsü (hektarla)") || param(lot, "Torpaq sahəsi (ha)");
  const extra = param(lot, "Əlavə məlumat");
  const note = param(lot, "Əlavə qeyd");
  const noteText = [extra, note].filter(Boolean).join("\n\n") || text(lot?.notes);
  const plate = plateFromTitle(lot);
  const startAt = when(lot?.startAt, locale);
  const validUntil = when(lot?.validUntil, locale);
  const whenValue = [startAt, validUntil].filter(Boolean).join(" — ") || null;

  const objectRows = [
    row("year", "Buraxılış ili", "Год", year),
    row("plate", "Dövlət nişanı", "Госномер", plate),
    row("vin", "Ban nömrəsi", "VIN / номер кузова", vin),
    mileage ? row("mileage", "Yürüş(km)", "Пробег", km(mileage)) : null,
    row("engine", "Mühərrik", "Двигатель", engine),
    row("fuel", "Yanacaq növü", "Топливо", fuel),
    row("gearbox", "Sürətlər qutusu", "Коробка", gearbox),
    row("body", "Ban növü", "Кузов", body),
    row("color", "Rəng", "Цвет", color),
    row("isNew", "Yeni", "Новый", isNew),
    row("place", "Ünvan", "Адрес", place),
    !place && city ? row("city", "Şəhər", "Город", city) : null,
    area ? row("area", "Sahəsi(m2)", "Площадь", sqm(area)) : null,
    row("rooms", "Otaq sayı", "Комнаты", rooms),
    row("floor", "Mərtəbəsi", "Этаж", floor),
    row("storeys", "Binanın mərtəbəliliyi", "Этажей в здании", param(lot, "Binanın mərtəbəliliyi") || text(lot?.buildingStoreys)),
    row("lift", "Lift", "Лифт", param(lot, "Lift") || text(lot?.lift)),
    row("usage", "İstifadə", "Использование", param(lot, "Əmlakın istifadə olunması barədə") || text(lot?.usageNote)),
    row("purpose", "Təyinat", "Назначение", building || landCategory),
    row("condition", "Vəziyyəti", "Состояние", condition),
    row("titleDoc", "Sənəd", "Документ", titleDoc),
    landHa ? row("landHa", "Torpaq sahəsi", "Площадь земли", `${landHa} ha`) : null,
  ].filter(Boolean);

  const tradeRows = [
    moneyRow("lotPrice", "Lot qiyməti", "Цена лота", lot?.lotPrice ?? lot?.marketPrice),
    moneyRow("initialPrice", "İlkin qiymət", "Начальная цена", lot?.minSalePrice),
    moneyRow("lastBid", "Son təklif", "Последняя ставка", lot?.lastBidPrice),
    moneyRow("deposit", "Beh", "Задаток", lot?.deposit),
    moneyRow("fee", "Rüsum", "Сбор", lot?.fee),
    moneyRow("minStep", "Minimal addım", "Минимальный шаг", lot?.minBidIncrement),
    moneyRow("maxStep", "Maksimal addım", "Максимальный шаг", lot?.maxBidIncrement),
    row("startAt", "Başlanğıc", "Начало торгов", startAt),
    row("validUntil", "Bitmə", "Окончание торгов", validUntil),
    row("round", "Raund", "Раунд", text(lot?.roundLabel)),
    row(
      "status",
      "Status",
      "Статус",
      text(lot?.herracStatus)
        ? (locale === "az" ? STATUS_AZ[lot.herracStatus] : locale === "en" ? STATUS_EN[lot.herracStatus] : STATUS_RU[lot.herracStatus]) || lot.herracStatus
        : null
    ),
    row(
      "attendance",
      "İştirak statusu",
      "Статус участия",
      text(lot?.attendanceStatus)
        ? (locale === "az" ? ATTEND_AZ[lot.attendanceStatus] : locale === "en" ? ATTEND_EN[lot.attendanceStatus] : ATTEND_RU[lot.attendanceStatus]) || lot.attendanceStatus
        : null
    ),
    lot?.attendantsCount != null && Number.isFinite(Number(lot.attendantsCount))
      ? row("attendants", "İştirakçılar", "Участники", String(lot.attendantsCount))
      : null,
    row("category", "Kateqoriya", "Категория Hərrac", text(lot?.categoryName)),
    lot?.noBids === true
      ? row("noBids", "Təklif yoxdur", "Ставок не было", locale === "az" ? "bəli" : locale === "en" ? "yes" : "да")
      : null,
  ].filter(Boolean);

  const usedParams = new Set(Object.keys(PARAM_RU));
  const otherRows = Object.entries(lot?.params && typeof lot.params === "object" ? lot.params : {})
    .filter(([name, value]) => !usedParams.has(name) && text(value))
    .map(([name, value]) => row(`param:${name}`, name, label(name, false), text(value)));

  const textRows = [
    row("extra", "Əlavə məlumat", "Дополнительно от Hərrac", extra),
    row("note", "Əlavə qeyd", "Примечание Hərrac", note),
    !extra && !note ? row("notes", "Mətn", "Текст Hərrac", text(lot?.notes)) : null,
    row("highlight", "Qısa sətir", "Краткая строка Hərrac", text(lot?.lotDataHighlight)),
    text(lot?.lotLocation)?.startsWith("http")
      ? row("map", "Xəritə", "Точка на карте", lot.lotLocation, { href: lot.lotLocation })
      : row("map", "Yer", "Место нахождения", text(lot?.lotLocation)),
  ].filter(Boolean);

  const sections = [
    { id: "object", titleAz: "Obyekt", titleRu: "Объект", titleEn: "Object", rows: objectRows },
    { id: "trade", titleAz: "Hərrac şərtləri", titleRu: "Условия торгов", titleEn: "Auction terms", rows: tradeRows },
    { id: "text", titleAz: "Mətn və yer", titleRu: "Текст и место", titleEn: "Text and place", rows: [...textRows, ...otherRows] },
  ].filter((section) => section.rows.length);

  const byId = new Map(
    [...objectRows, ...tradeRows, ...textRows, ...otherRows].map((item) => [item.id, item])
  );
  if (whenValue) {
    byId.set("when", {
      id: "when",
      labelAz: "Hərrac vaxtı",
      labelRu: "Срок торгов",
      labelEn: "Auction window",
      value: whenValue,
    });
  }
  if (noteText && !byId.has("note")) {
    byId.set("note", {
      id: "note",
      labelAz: "Mətn",
      labelRu: "Текст Hərrac",
      labelEn: "Hərrac text",
      value: noteText,
    });
  }
  const order = auto ? AUTO_HIGHLIGHTS : ESTATE_HIGHLIGHTS;
  const highlights = order.map((id) => byId.get(id)).filter(Boolean).slice(0, 7);

  return { highlights, sections };
}
