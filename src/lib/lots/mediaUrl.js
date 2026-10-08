/**
 * URL фото → same-origin proxy для herrac (и относительных /v1/files|/gw/fs).
 */

const HERRAC_ORIGIN = "https://herrac.gov.az";

function absolutizeHerrac(url) {
  if (!url || typeof url !== "string") return "";
  const u = url.trim();
  if (!u) return "";
  if (u.startsWith("data:") || u.startsWith("blob:")) return u;
  if (u.startsWith("/api/media/proxy")) return u;
  if (/^https?:\/\//i.test(u)) return u;

  // API: "/v1/files/stream/…" → публичный стрим /gw/fs/v1/files/…
  if (u.startsWith("/v1/files/")) return `${HERRAC_ORIGIN}/gw/fs${u}`;
  if (u.startsWith("/gw/")) return `${HERRAC_ORIGIN}${u}`;
  if (u.startsWith("/")) return `${HERRAC_ORIGIN}${u}`;
  // голый id стрима
  if (/^\d{10,}$/.test(u)) {
    return `${HERRAC_ORIGIN}/gw/fs/v1/files/stream/${u}`;
  }
  return u;
}

function needsProxy(absoluteUrl) {
  try {
    const host = new URL(absoluteUrl).hostname.toLowerCase();
    return (
      host === "herrac.gov.az" ||
      host === "www.herrac.gov.az" ||
      host === "eherrac.com" ||
      host === "www.eherrac.com" ||
      host === "apiherrac.gov.az" ||
      host.endsWith(".herrac.gov.az")
    );
  } catch {
    return false;
  }
}

export function mediaUrl(url) {
  const abs = absolutizeHerrac(url);
  if (!abs) return "";
  if (abs.startsWith("/api/media/proxy")) return abs;
  if (abs.startsWith("data:") || abs.startsWith("blob:")) return abs;
  if (needsProxy(abs)) {
    return `/api/media/proxy?url=${encodeURIComponent(abs)}`;
  }
  return abs;
}

/** Исходный абсолютный URL herrac (для fallback без proxy) */
export function herracDirectUrl(url) {
  const abs = absolutizeHerrac(url);
  if (!abs || abs.startsWith("/api/media/proxy") || abs.startsWith("data:")) {
    return "";
  }
  return needsProxy(abs) ? abs : "";
}
