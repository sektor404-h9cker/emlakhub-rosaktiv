/**
 * Вежливый HTTP к публичным маркетам (bina / turbo)
 */
const UA =
  "EmlakHub/1.0 (+https://emlakhub.net; market comps analytics; contact=admin@emlak.az)";

let lastAt = 0;
const MIN_DELAY = 2200;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function marketPace() {
  const wait = lastAt + MIN_DELAY + Math.floor(Math.random() * 900) - Date.now();
  if (wait > 0) await sleep(wait);
  lastAt = Date.now();
}

export async function marketFetch(url, opts = {}) {
  await marketPace();
  const { json, headers, ...rest } = opts;
  const res = await fetch(url, {
    ...rest,
    headers: {
      Accept: json ? "application/json" : "text/html",
      "User-Agent": UA,
      ...(headers || {}),
    },
    signal: AbortSignal.timeout ? AbortSignal.timeout(40000) : undefined,
    cache: "no-store",
  });
  const text = await res.text();
  if (!res.ok) {
    const err = new Error(`market ${res.status}: ${text.slice(0, 120)}`);
    err.status = res.status;
    throw err;
  }
  if (json) {
    try {
      return JSON.parse(text);
    } catch {
      throw new Error("market invalid json");
    }
  }
  return text;
}

export function median(nums) {
  const a = nums.filter((n) => Number.isFinite(n)).sort((x, y) => x - y);
  if (!a.length) return null;
  const m = Math.floor(a.length / 2);
  return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2;
}

export function percentile(nums, p) {
  const a = nums.filter((n) => Number.isFinite(n)).sort((x, y) => x - y);
  if (!a.length) return null;
  const i = Math.min(a.length - 1, Math.max(0, Math.floor((p / 100) * (a.length - 1))));
  return a[i];
}
