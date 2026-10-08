/**
 * Читает только то, что уже лежит в лоте. Ничего не дописывает.
 * Веса полей — в productRules, не здесь.
 */
import { parseAutoIdentity } from "../markets/turbo";

const PLATE_RE = /\b\d{2}-[A-Z]{2}-\d{3}\b/;
const CADASTRE_RE = /kadastr|reyestr nömr|qeydiyyat nömr|кадастр/i;
const ENCUMBRANCE_RE = /ipotek|ипотек|həbs|hebs|арест|yüklənm|yuklen|обремен/i;
const INSPECTION_RE = /baxış|baxis|осмотр/i;
const DOCUMENT_RE = /şəhadətnamə|shehadetname|sənəd|sened|çıxarış|cixaris|документ/i;

export const FIELD_LABEL = {
  model: { ru: "Модель", az: "Model", en: "Model" },
  year: { ru: "Год", az: "İl", en: "Year" },
  mileage: { ru: "Пробег", az: "Yürüş", en: "Mileage" },
  engine: { ru: "Двигатель", az: "Mühərrik", en: "Engine" },
  description: { ru: "Описание", az: "Təsvir", en: "Description" },
  photos: { ru: "Фото", az: "Foto", en: "Photos" },
  identifier: { ru: "VIN или госномер", az: "VIN və ya dövlət nömrəsi", en: "VIN or plate" },
  dates: { ru: "Дата торгов", az: "Hərrac tarixi", en: "Auction date" },
  deposit: { ru: "Задаток", az: "Beh", en: "Deposit" },
  fee: { ru: "Сбор", az: "Rüsum", en: "Fee" },
  place: { ru: "Место", az: "Yer", en: "Place" },
  documents: { ru: "Документы", az: "Sənədlər", en: "Documents" },
  area: { ru: "Площадь", az: "Sahə", en: "Area" },
  rooms: { ru: "Комнаты", az: "Otaqlar", en: "Rooms" },
  floor: { ru: "Этаж", az: "Mərtəbə", en: "Floor" },
  address: { ru: "Адрес", az: "Ünvan", en: "Address" },
  district: { ru: "Район или город", az: "Rayon və ya şəhər", en: "District or city" },
  cadastral: { ru: "Кадастр или реестр", az: "Kadastr və ya reyestr", en: "Cadastre or registry" },
  purpose: { ru: "Назначение", az: "Təyinat", en: "Purpose" },
  encumbrance: { ru: "Обременение", az: "Yüklülük", en: "Encumbrance" },
  inspection: { ru: "Условия осмотра", az: "Baxış şərti", en: "Inspection terms" },
};

export function intelligenceProfile(lot) {
  const market = lot?.market || "other";
  if (market === "auto" || market === "equipment") return "auto";
  if (market === "land") return "land";
  if (market === "commercial") return "commercial";
  if (market === "estate") return isApartment(lot) ? "apartment" : "house";
  return "other";
}

export function isApartment(lot) {
  const blob = `${lot?.categoryName || ""} ${lot?.typeAz || ""} ${lot?.titleAz || ""} ${lot?.titleRu || ""}`;
  return /mənzil|menzil|квартир/i.test(blob);
}

export function autoIdentity(lot) {
  return parseAutoIdentity(lot?.titleAz || lot?.titleRu || "", lot?.params || {});
}

export function plateFromTitle(lot) {
  const title = `${lot?.titleAz || ""} ${lot?.titleRu || ""}`;
  const found = title.match(PLATE_RE);
  return found ? found[0] : null;
}

export function fieldValue(lot, id) {
  const identity = id === "model" ? autoIdentity(lot) : null;
  switch (id) {
    case "model": {
      const name = [identity?.make, identity?.model].filter(Boolean).join(" ");
      return name || null;
    }
    case "year":
      return fieldPresent(lot, "year") ? String(lot.year) : null;
    case "mileage":
      return fieldPresent(lot, "mileage")
        ? `${Math.round(Number(lot.mileageKm)).toLocaleString("ru-RU")} км`
        : null;
    case "engine":
      return text(lot?.engine);
    case "place":
    case "address":
      return text(lot?.districtAz || lot?.params?.["Əmlakın yerləşdiyi ünvan"]);
    case "district":
      return text(lot?.cityAz || lot?.cityRu);
    case "area":
      if (Number.isFinite(Number(lot?.areaSqm))) return `${lot.areaSqm} м²`;
      if (Number.isFinite(Number(lot?.landAreaHa))) return `${lot.landAreaHa} ha`;
      return null;
    case "rooms":
      return fieldPresent(lot, "rooms") ? String(lot.rooms) : null;
    case "floor":
      return fieldPresent(lot, "floor") ? String(lot.floor) : null;
    case "deposit":
      return fieldPresent(lot, "deposit") ? `${Math.round(Number(lot.deposit)).toLocaleString("ru-RU")} ₼` : null;
    case "fee":
      return fieldPresent(lot, "fee") ? `${Math.round(Number(lot.fee)).toLocaleString("ru-RU")} ₼` : null;
    case "identifier":
      return text(lot?.vin) || plateFromTitle(lot);
    default:
      return null;
  }
}

function text(value) {
  const shown = String(value ?? "").trim();
  return shown || null;
}

export function fieldPresent(lot, id) {
  const params = lot?.params || {};
  const notes = String(lot?.notes || "");
  const blob = `${notes}\n${Object.entries(params)
    .map(([key, value]) => `${key}: ${value ?? ""}`)
    .join("\n")}`;

  switch (id) {
    case "model":
      return String(autoIdentity(lot).model || "").trim().length >= 2;
    case "year": {
      const year = Number(lot?.year);
      return Number.isFinite(year) && year >= 1950 && year <= 2035;
    }
    case "mileage":
      return Number.isFinite(Number(lot?.mileageKm));
    case "engine":
      return String(lot?.engine || "").trim().length > 0;
    case "description":
      return notes.trim().length > 0;
    case "photos":
      return (
        (Array.isArray(lot?.photos) && lot.photos.length > 0) ||
        Boolean(lot?.photo)
      );
    case "identifier":
      return String(lot?.vin || "").trim().length > 0 || Boolean(plateFromTitle(lot));
    case "dates":
      return Boolean(lot?.startAt || lot?.validUntil);
    case "deposit":
      return Number.isFinite(Number(lot?.deposit));
    case "fee":
      return Number.isFinite(Number(lot?.fee));
    case "place":
      return Boolean(addressOf(lot) || lot?.lotLocation);
    case "documents":
      return String(lot?.titleDoc || "").trim().length > 0 || DOCUMENT_RE.test(blob);
    case "area":
      return (
        Number.isFinite(Number(lot?.areaSqm)) ||
        Number.isFinite(Number(lot?.landAreaHa)) ||
        Number.isFinite(Number(lot?.landAreaSqm))
      );
    case "rooms":
      return Number.isFinite(Number(lot?.rooms));
    case "floor":
      return Number.isFinite(Number(lot?.floor));
    case "address":
      return Boolean(addressOf(lot));
    case "district":
      return Boolean(lot?.cityAz || lot?.cityRu || params["Əmlakın yerləşdiyi şəhər və ya rayon"]);
    case "cadastral":
      return CADASTRE_RE.test(blob);
    case "purpose":
      return Boolean(lot?.buildingType || lot?.landCategory || lot?.condition);
    case "encumbrance":
      return ENCUMBRANCE_RE.test(blob);
    case "inspection":
      return INSPECTION_RE.test(blob);
    default:
      return false;
  }
}

function addressOf(lot) {
  const params = lot?.params || {};
  return (
    lot?.districtAz ||
    params["Əmlakın yerləşdiyi ünvan"] ||
    ""
  );
}
