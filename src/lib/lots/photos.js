/**
 * Нормализация галереи фото лота (herrac: payload.photos + photo)
 */
import { mediaUrl } from "./mediaUrl";

export function lotPhotos(lot, { proxy = false } = {}) {
  if (!lot) return [];
  const raw = Array.isArray(lot.photos)
    ? lot.photos
    : Array.isArray(lot.payload?.photos)
      ? lot.payload.photos
      : [];
  const list = raw.filter((u) => typeof u === "string" && u.length > 0);
  let out = list.length ? [...new Set(list)] : lot.photo ? [lot.photo] : [];
  if (proxy) out = out.map(mediaUrl).filter(Boolean);
  return out;
}

export function lotPhotoCount(lot) {
  return lotPhotos(lot).length;
}

/** Предстоящий лот: ещё не стартовал на herrac */
export function isUpcomingLot(lot) {
  if (!lot) return false;
  const status = String(lot.herracStatus || lot.payload?.herracStatus || "").toUpperCase();
  if (status === "NOT_STARTED" || status === "PENDING" || status === "SCHEDULED") {
    return true;
  }
  const start = lot.startAt || lot.payload?.startAt;
  if (!start) return false;
  const t = new Date(start).getTime();
  return Number.isFinite(t) && t > Date.now();
}

export function isLiveLot(lot) {
  if (!lot) return false;
  const status = String(lot.herracStatus || lot.payload?.herracStatus || "").toUpperCase();
  if (status === "ONGOING" || status === "ACTIVE") return true;
  if (isUpcomingLot(lot)) return false;
  return status === "" || status === "ONGOING";
}

export function formatAuctionWhen(iso, locale = "ru") {
  if (!iso) return "";
  const d = new Date(iso);
  if (!Number.isFinite(d.getTime())) return "";
  try {
    return d.toLocaleString(locale === "az" ? "az-AZ" : "ru-RU", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return d.toISOString().slice(0, 16).replace("T", " ");
  }
}
