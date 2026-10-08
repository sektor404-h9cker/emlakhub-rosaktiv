/**
 * HTTP-клиент herrac.gov.az.
 * Только публичные GET. Ошибка сети не превращается в пустой лот:
 * её ловит sync и отдаёт человеку «Hərrac временно недоступен».
 */
import {
  HERRAC_GW,
  HERRAC_ORIGIN,
  HERRAC_RATE,
  HERRAC_UA,
  HERRAC_SORT,
  DEFAULT_SYNC_CATEGORY_IDS,
} from "./constants";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

let lastRequestAt = 0;

async function pace(opts = {}) {
  const min = opts.minDelayMs ?? HERRAC_RATE.minDelayMs;
  const jitterMax = opts.jitterMs ?? HERRAC_RATE.jitterMs;
  const wait = lastRequestAt + min + Math.floor(Math.random() * jitterMax) - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

/**
 * @param {string} pathOrUrl
 * @param {{ retries?: number }} [opts]
 */
function noteRequest(opts, event) {
  if (!Array.isArray(opts.log)) return;
  if (opts.log.length >= 80) return;
  opts.log.push(event);
}

function requestKind(url) {
  if (url.includes("/auctions/details/")) return "DETAIL";
  if (url.includes("/os/v1/auctions")) return "LIST";
  return "GET";
}

export async function herracFetch(pathOrUrl, opts = {}) {
  const url = pathOrUrl.startsWith("http")
    ? pathOrUrl
    : `${HERRAC_GW}${pathOrUrl.startsWith("/") ? "" : "/"}${pathOrUrl}`;
  const retries = opts.retries ?? HERRAC_RATE.maxRetries;
  const method = opts.method || "GET";
  const retryBaseMs = opts.retryBaseMs ?? HERRAC_RATE.retryBaseMs;

  let lastErr;
  for (let attempt = 0; attempt <= retries; attempt++) {
    await pace(opts);
    const started = Date.now();
    try {
      const headers = {
        Accept: "application/json",
        "User-Agent": HERRAC_UA,
        Referer: `${HERRAC_ORIGIN}/auctions`,
        Origin: HERRAC_ORIGIN,
      };
      if (opts.body !== undefined) headers["Content-Type"] = "application/json";
      const res = await fetch(url, {
        method,
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: AbortSignal.timeout
          ? AbortSignal.timeout(opts.timeoutMs ?? 45000)
          : undefined,
        cache: "no-store",
      });

      const text = await res.text();
      let json = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = null;
      }

      if (res.status >= 500 || res.status === 429) {
        lastErr = new Error(
          `herrac ${res.status}: ${json?.message || text.slice(0, 120)}`
        );
        lastErr.status = res.status;
        lastErr.body = json;
        const backoff = retryBaseMs * Math.pow(2, attempt);
        noteRequest(opts, {
          at: new Date().toISOString(),
          kind: requestKind(url),
          path: safeRequestPath(url),
          status: res.status,
          ms: Date.now() - started,
          attempt: attempt + 1,
          result: res.status === 429 ? `backoff ${Math.round(backoff / 1000)}s` : "retry",
        });
        if (res.status === 429 && attempt >= 2) throw lastErr;
        if (attempt >= retries) throw lastErr;
        await sleep(backoff);
        continue;
      }

      if (!res.ok) {
        const err = new Error(
          `herrac ${res.status}: ${json?.message || text.slice(0, 120)}`
        );
        err.status = res.status;
        err.body = json;
        throw err;
      }

      noteRequest(opts, {
        at: new Date().toISOString(),
        kind: requestKind(url),
        path: safeRequestPath(url),
        status: res.status,
        ms: Date.now() - started,
        attempt: attempt + 1,
        result: "ok",
      });
      return json;
    } catch (e) {
      lastErr = e;
      if (e?.status === 429 && attempt >= 2) throw e;
      if (e?.status && e.status < 500 && e.status !== 429) throw e;
      const backoff = retryBaseMs * Math.pow(2, attempt);
      noteRequest(opts, {
        at: new Date().toISOString(),
        kind: requestKind(url),
        path: safeRequestPath(url),
        status: e?.status || 0,
        ms: Date.now() - started,
        attempt: attempt + 1,
        result: "network",
      });
      if (attempt >= retries) break;
      await sleep(backoff);
    }
  }
  throw lastErr || new Error("herrac fetch failed");
}

function safeRequestPath(url) {
  try {
    const u = new URL(url);
    const page = u.searchParams.get("page");
    const tail = u.pathname.replace("/gw", "");
    return page != null ? `${tail} page=${page}` : tail;
  } catch {
    return "herrac";
  }
}

export async function fetchCategories() {
  const json = await herracFetch(
    "/os/v1/lots/categories/filters?filterType=ONGOING&showAll=false"
  );
  return json?.data || [];
}

/** Динамические фильтры (şəhər, əlavə məlumat, …) для выбранных категорий */
export async function fetchCategoryFilterDetails(categoryIds = []) {
  if (!categoryIds?.length) return [];
  const params = new URLSearchParams({
    categoryIds: categoryIds.join(","),
  });
  const json = await herracFetch(
    `/os/v1/lots/categories/filters/details?${params}`
  );
  return json?.data || [];
}

/**
 * Собрать query для /os/v1/auctions из UI-фильтров.
 * @param {{
 *   categoryIds?: string[],
 *   page?: number,
 *   size?: number,
 *   status?: string,
 *   includeNotStarted?: boolean,
 *   isFirstRound?: boolean|null,
 *   locationSearchValue?: string,
 *   nameSearchValue?: string,
 *   priceFrom?: number|string|null,
 *   priceTo?: number|string|null,
 *   from?: string|null,
 *   to?: string|null,
 *   sortColumns?: string,
 *   bodyFilters?: object[]|null,
 * }} filters
 */
export function buildAuctionListParams(filters = {}) {
  const {
    categoryIds = DEFAULT_SYNC_CATEGORY_IDS,
    page = 0,
    size = HERRAC_RATE.pageSize,
    status = "ONGOING",
    includeNotStarted = true,
    isFirstRound = null,
    locationSearchValue = "",
    nameSearchValue = "",
    priceFrom = null,
    priceTo = null,
    from = null,
    to = null,
    sortColumns = HERRAC_SORT.DATE_DESC,
    bodyFilters = null,
  } = filters;

  const params = new URLSearchParams({
    size: String(size),
    page: String(page),
    userFilter: "false",
    status,
    sortColumns,
  });

  if (includeNotStarted) params.set("includeNotStarted", "true");
  else params.set("includeNotStarted", "false");

  if (categoryIds?.length) params.set("categoryIds", categoryIds.join(","));
  if (isFirstRound === true) params.set("isFirstRound", "true");
  if (isFirstRound === false) params.set("isFirstRound", "false");
  if (locationSearchValue) params.set("locationSearchValue", locationSearchValue);
  if (nameSearchValue) params.set("nameSearchValue", nameSearchValue);
  if (priceFrom != null && priceFrom !== "")
    params.set("priceFrom", String(priceFrom));
  if (priceTo != null && priceTo !== "") params.set("priceTo", String(priceTo));
  if (from) params.set("from", String(from));
  if (to) params.set("to", String(to));
  if (Array.isArray(bodyFilters) && bodyFilters.length) {
    params.set("bodyFilters", JSON.stringify(bodyFilters));
  }
  return params;
}

/**
 * Список аукционов (Spring-like page).
 * На стороне herrac иногда 500 (AUCTION_ORGANIZATION_SERVICE_001) — вызывающий код должен ловить.
 */
export async function fetchAuctionPage(filters = {}) {
  const page = filters.page ?? 0;
  const params = buildAuctionListParams(filters);
  const json = await herracFetch(`/os/v1/auctions?${params}`, {
    log: filters.log,
    method: "POST",
    body: Array.isArray(filters.body) ? filters.body : [],
    retries: filters.retries,
    minDelayMs: filters.minDelayMs,
    jitterMs: filters.jitterMs,
    retryBaseMs: filters.retryBaseMs,
    timeoutMs: filters.timeoutMs,
  });
  const data = json?.data;
  if (!data)
    return { content: [], totalElements: 0, totalPages: 0, number: page };

  if (Array.isArray(data)) {
    return {
      content: data,
      totalElements: data.length,
      totalPages: 1,
      number: page,
    };
  }

  const content =
    data.content || data.items || data.auctions || data.list || [];
  const size = Number(data.size || filters.size || HERRAC_RATE.pageSize);
  return {
    content: Array.isArray(content) ? content : [],
    totalElements: Number(
      data.totalElements ?? data.total ?? data.totalCount ?? content.length
    ),
    totalPages: Number(
      data.totalPages ??
        (Math.ceil(Number(data.totalElements ?? content.length) / size) || 1)
    ),
    number: Number(data.number ?? data.pageNumber ?? page),
  };
}

export async function fetchAuctionDetail(auctionId, opts = {}) {
  const json = await herracFetch(`/os/v1/auctions/details/${auctionId}`, {
    log: opts.log,
    retries: opts.retries,
    minDelayMs: opts.minDelayMs,
    jitterMs: opts.jitterMs,
    retryBaseMs: opts.retryBaseMs,
    timeoutMs: opts.timeoutMs,
  });
  if (!json?.data?.id) {
    const err = new Error(`herrac detail empty for ${auctionId}`);
    err.status = 404;
    throw err;
  }
  return json.data;
}

/**
 * Discovery: все страницы list (с лимитом).
 * @param {string[]|object} categoryIdsOrFilters
 * @returns {{ items: object[], ok: boolean, error?: string }}
 */
export async function discoverAuctions(categoryIdsOrFilters = DEFAULT_SYNC_CATEGORY_IDS) {
  const filters = Array.isArray(categoryIdsOrFilters)
    ? { categoryIds: categoryIdsOrFilters }
    : categoryIdsOrFilters || {};
  const log = filters.log || [];
  const items = [];
  let error = null;
  let status = null;
  let complete = false;
  let truncated = false;
  try {
    const first = await fetchAuctionPage({ ...filters, log, page: 0 });
    const totalPages = Math.max(first.totalPages || 1, 1);
    const pages = Math.min(totalPages, HERRAC_RATE.maxListPages);
    truncated = totalPages > HERRAC_RATE.maxListPages;
    items.push(...first.content);
    for (let p = 1; p < pages; p++) {
      const next = await fetchAuctionPage({ ...filters, log, page: p });
      items.push(...next.content);
    }
    complete = !truncated;
  } catch (e) {
    error = e.message || String(e);
    status = e.status;
    complete = false;
  }
  const byId = new Map();
  for (const it of items) {
    const id = String(it.id || it.auctionId || "");
    if (id) byId.set(id, it);
  }
  return {
    items: [...byId.values()],
    ok: !error,
    complete,
    truncated,
    error,
    status,
    log,
  };
}
