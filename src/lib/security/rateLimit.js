/**
 * In-memory rate limit for a single Node process.
 * Several instances need a shared store; see PRODUCTION.md.
 */

const buckets = new Map();

export function rateLimit({ key, limit, windowMs, now = Date.now() }) {
  const row = buckets.get(key);
  if (!row || now > row.reset) {
    buckets.set(key, { count: 1, reset: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }
  if (row.count >= limit) {
    return { ok: false, retryAfter: Math.max(1, Math.ceil((row.reset - now) / 1000)) };
  }
  row.count += 1;
  return { ok: true, retryAfter: 0 };
}

export function clientAddress(request) {
  const fwd = request.headers.get("x-forwarded-for") || "";
  const first = fwd.split(",")[0].trim();
  return first || request.headers.get("x-real-ip") || "local";
}

export function resetRateLimits() {
  buckets.clear();
}
