/**
 * CLI sync herrac.gov.az → Postgres (без Next path-aliases)
 * Usage:
 *   node scripts/herrac-sync.js --force --seed=283599278243160064 --max=24
 */
const path = require("path");
const fs = require("fs");
const { PrismaClient } = require("@prisma/client");

function loadEnvFile(file) {
  const p = path.join(process.cwd(), file);
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (!m) continue;
    const key = m[1].trim();
    let val = m[2].trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = val;
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const ORIGIN = "https://herrac.gov.az";
const GW = `${ORIGIN}/gw`;
const CAT_AUTO = "15707206488020125";
const CAT_APT = "16057480568139276";
const CAT_COMM = "16057480568289305";
const CAT_HOUSE = "16057480568289306";
const CAT_OTHER = "16057480568289307";
const DEFAULT_CATS = [CAT_AUTO, CAT_APT, CAT_COMM, CAT_HOUSE, CAT_OTHER];
const CAT_MARKET = {
  [CAT_AUTO]: "auto",
  [CAT_APT]: "estate",
  [CAT_COMM]: "commercial",
  [CAT_HOUSE]: "estate",
  [CAT_OTHER]: "other",
};

const MIN_DELAY = 2800;
const JITTER = 1800;
let lastAt = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pace() {
  const wait = lastAt + MIN_DELAY + Math.floor(Math.random() * JITTER) - Date.now();
  if (wait > 0) await sleep(wait);
  lastAt = Date.now();
}

async function herracGet(urlPath, opts = {}) {
  const url = urlPath.startsWith("http") ? urlPath : `${GW}${urlPath}`;
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    await pace();
    try {
      const res = await fetch(url, {
        method: opts.method || "GET",
        headers: {
          Accept: "application/json",
          "User-Agent":
            "EmlakHub/1.0 (+https://emlakhub.net; auction analytics for investors; contact=admin@emlak.az)",
          Referer: `${ORIGIN}/auctions`,
          Origin: ORIGIN,
          ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
      });
      const json = await res.json().catch(() => ({}));
      if (res.status >= 500 || res.status === 429) {
        lastErr = new Error(json.message || `HTTP ${res.status}`);
        await sleep(4000 * 2 ** attempt);
        continue;
      }
      if (!res.ok) throw new Error(json.message || `HTTP ${res.status}`);
      return json;
    } catch (e) {
      lastErr = e;
      await sleep(4000 * 2 ** attempt);
    }
  }
  throw lastErr;
}

function slugify(text) {
  const map = {
    ə: "e",
    Ə: "e",
    ı: "i",
    İ: "i",
    ğ: "g",
    Ğ: "g",
    ö: "o",
    Ö: "o",
    ü: "u",
    Ü: "u",
    ç: "c",
    Ç: "c",
    ş: "s",
    Ş: "s",
  };
  return String(text || "")
    .split("")
    .map((ch) => map[ch] || ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}

function flattenParams(sectionData = []) {
  const out = {};
  for (const s of sectionData) {
    for (const row of s?.lotData || []) {
      if (row?.paramName) out[row.paramName] = row.valueText ?? null;
    }
  }
  return out;
}

function absImg(p) {
  if (!p) return null;
  if (p.startsWith("http")) return p;
  if (p.startsWith("/v1/files/")) return `${ORIGIN}/gw/fs${p}`;
  if (p.startsWith("/")) return `${ORIGIN}${p}`;
  return `${ORIGIN}/gw/fs/v1/files/stream/${p}`;
}

function refineMarket(categoryId, lotName) {
  let m = CAT_MARKET[String(categoryId)] || "other";
  const n = String(lotName).toLowerCase();
  if (
    m === "auto" &&
    /ekskavator|texnika|yarımqoşqu|yarimqosqu|traktor/.test(n)
  ) {
    m = "equipment";
  }
  return m;
}

function mapDetail(detail, slugHint) {
  const id = String(detail.id);
  const params = flattenParams(detail.sectionData);
  const titleAz = detail.lotName || `Hərrac #${id}`;
  const slug = slugHint || slugify(titleAz) || id;
  const images = (detail.lotImageUrls || []).map(absImg).filter(Boolean);
  const notes = [params["Əlavə məlumat"], params["Əlavə qeyd"]]
    .filter(Boolean)
    .join("\n\n");
  const redFlags =
    /borclud|işlək deyil|islək deyil|açar|saxlanma xərci|həbs|ipotek/i.test(
      notes + " " + titleAz
    );
  const marketPrice = detail.lotPrice ?? null;
  const startPrice =
    Number(detail.lastBidPrice ?? detail.offerPrice ?? detail.initialPrice ?? detail.lotPrice ?? 0) ||
    0;
  let expectedProfit = null;
  let expectedMarginPct = null;
  if (marketPrice != null && startPrice != null && Number(marketPrice) > 0) {
    expectedProfit = Math.round((Number(marketPrice) - startPrice) * 100) / 100;
    expectedMarginPct =
      Math.round(((Number(marketPrice) - startPrice) / Number(marketPrice)) * 1000) / 10;
  }
  const addressAz = params["Əmlakın yerləşdiyi ünvan"] || "";
  const landHaRaw =
    params["Torpaq sahəsinin ölçüsü (hektarla)"] ||
    params["Torpaq sahəsi (ha)"] ||
    null;
  const landHa = landHaRaw != null && landHaRaw !== "" ? Number(landHaRaw) : null;
  const roundNumber = detail.roundNumber ?? null;
  return {
    registryNo: id,
    titleAz,
    titleRu: titleAz,
    titleEn: titleAz,
    cityAz: params["Əmlakın yerləşdiyi şəhər və ya rayon"] || "",
    cityRu: params["Əmlakın yerləşdiyi şəhər və ya rayon"] || "",
    market: refineMarket(detail.categoryId, titleAz),
    startPrice,
    score: redFlags ? 35 : 55,
    status: "published",
    payload: {
      source: "herrac",
      herracId: id,
      herracUrl: `${ORIGIN}/auctions/${id}/${slug}`,
      herracStatus: detail.status,
      categoryId: String(detail.categoryId || ""),
      categoryName: detail.categoryName,
      roundNumber,
      roundLabel:
        roundNumber == null
          ? null
          : Number(roundNumber) <= 1
            ? "İlkin hərrac"
            : "Təkrar hərrac",
      startAt: detail.startAt,
      validUntil: detail.validUntil,
      marketPrice,
      minSalePrice: detail.initialPrice ?? null,
      lastBidPrice: detail.lastBidPrice ?? null,
      deposit: detail.advanceAmount ?? null,
      fee: detail.feeAmount ?? null,
      fees: (Number(detail.advanceAmount) || 0) + (Number(detail.feeAmount) || 0) || null,
      expectedProfit,
      expectedMarginPct,
      attendantsCount: detail.attendantsCount ?? 0,
      noBids: Boolean(detail.noBids),
      lotLocation: detail.lotLocation,
      lotDataHighlight: detail.lotDataHighlight || null,
      params,
      notes,
      photo: images[0] || null,
      photos: images,
      typeAz: detail.categoryName || null,
      districtAz: addressAz,
      districtRu: "",
      redFlags,
      syncedAt: new Date().toISOString(),
      vin: params["Ban nömrəsi"] || null,
      year: params["Buraxılış ili"] || null,
      bodyType: params["Ban növü"] || null,
      color: params["Rəng"] || null,
      mileageKm: params["Yürüş(km)"] ? Number(params["Yürüş(km)"]) : null,
      engine: params["Mühərrik"] || null,
      fuel: params["Yanacaq növü"] || null,
      gearbox: params["Sürətlər qutusu"] || null,
      isNew: params["Yeni"] || null,
      areaSqm: params["Sahəsi(m2)"] ? Number(params["Sahəsi(m2)"]) : null,
      rooms: params["Otaq sayı"] ? Number(params["Otaq sayı"]) : null,
      floor: params["Mərtəbəsi"] ? Number(params["Mərtəbəsi"]) : null,
      buildingType: params["Tikilinin növü"] || null,
      condition: params["Vəziyyəti"] || null,
      titleDoc: params["Hüquq müəyyən edici sənəd"] || null,
      landCategory: params["Torpaq sahəsinin kateqoriyası"] || null,
      landAreaHa: Number.isFinite(landHa) ? landHa : null,
      landAreaSqm:
        Number.isFinite(landHa) ? Math.round(landHa * 10000 * 100) / 100 : null,
    },
  };
}

async function upsert(prisma, mapped) {
  const existing = await prisma.lot.findFirst({
    where: { registryNo: mapped.registryNo },
  });
  if (!existing) {
    return prisma.lot.create({
      data: {
        registryNo: mapped.registryNo,
        titleAz: mapped.titleAz,
        titleRu: mapped.titleRu,
        titleEn: mapped.titleEn,
        cityAz: mapped.cityAz,
        cityRu: mapped.cityRu,
        market: mapped.market,
        startPrice: mapped.startPrice,
        score: mapped.score,
        status: mapped.status,
        payload: mapped.payload,
      },
    });
  }
  const prev =
    existing.payload && typeof existing.payload === "object"
      ? existing.payload
      : {};
  return prisma.lot.update({
    where: { id: existing.id },
    data: {
      titleAz: mapped.titleAz,
      titleRu: mapped.titleRu,
      titleEn: mapped.titleEn,
      cityAz: mapped.cityAz,
      cityRu: mapped.cityRu,
      market: mapped.market,
      startPrice: mapped.startPrice,
      score: existing.score > 0 ? existing.score : mapped.score,
      status: existing.status === "hidden" ? "hidden" : mapped.status,
      payload: { ...prev, ...mapped.payload },
    },
  });
}

async function discover(categoryIds) {
  try {
    const items = [];
    let page = 0;
    let pages = 1;
    while (page < pages && page < 12) {
      const params = new URLSearchParams({
        size: "24",
        page: String(page),
        userFilter: "false",
        status: "ONGOING",
        includeNotStarted: "true",
        sortColumns: "DATE_DESC",
        categoryIds: categoryIds.join(","),
      });
      const json = await herracGet(`/os/v1/auctions?${params}`, { method: "POST", body: [] });
      const data = json.data || {};
      const content = data.content || data.items || (Array.isArray(data) ? data : []);
      items.push(...content);
      pages = Math.max(Number(data.totalPages || 1), 1);
      page += 1;
    }
    return { ok: true, items };
  } catch (e) {
    return { ok: false, items: [], error: e.message };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const seedArg = args.find((a) => a.startsWith("--seed="));
  const maxArg = args.find((a) => a.startsWith("--max="));
  const seedIds = seedArg
    ? seedArg
        .slice(7)
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];
  const maxDetails = maxArg ? Number(maxArg.slice(6)) : 36;

  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL missing");
    process.exit(1);
  }

  const prisma = new PrismaClient();
  const report = {
    discovery: null,
    upserted: [],
    errors: [],
  };

  const queue = new Map();
  const bump = (id, pri, slug) => {
    if (!id) return;
    const prev = queue.get(id);
    if (!prev || pri > prev.pri) queue.set(id, { id, pri, slug });
  };

  for (const id of seedIds) bump(id, 100);

  if (force || seedIds.length === 0) {
    const disc = await discover(DEFAULT_CATS);
    report.discovery = {
      ok: disc.ok,
      found: disc.items.length,
      error: disc.error || null,
    };
    for (const it of disc.items) {
      bump(String(it.id), 70, slugify(it.lotName || ""));
    }
  }

  // уже известные
  const existing = await prisma.lot.findMany({
    where: { registryNo: { not: null } },
    select: { registryNo: true, payload: true },
  });
  for (const row of existing) {
    const p = row.payload || {};
    if (p.source && p.source !== "herrac") continue;
    bump(row.registryNo, 40);
  }

  const ordered = [...queue.values()]
    .sort((a, b) => b.pri - a.pri)
    .slice(0, maxDetails);

  console.log(
    `Queue ${ordered.length} (discovery ${report.discovery?.ok ? "ok" : "fail/skip"})`
  );

  for (const item of ordered) {
    try {
      const json = await herracGet(`/os/v1/auctions/details/${item.id}`);
      const detail = json.data;
      if (!detail?.id) throw new Error("empty detail");
      if (
        detail.categoryId &&
        !DEFAULT_CATS.includes(String(detail.categoryId)) &&
        !seedIds.includes(item.id)
      ) {
        continue;
      }
      const mapped = mapDetail(detail, item.slug);
      await upsert(prisma, mapped);
      report.upserted.push(item.id);
      console.log("✓", item.id, mapped.market, mapped.startPrice);
    } catch (e) {
      report.errors.push({ id: item.id, message: e.message });
      console.error("✗", item.id, e.message);
    }
  }

  await prisma.auditLog.create({
    data: {
      actorEmail: "cli@herrac-sync",
      action: "herrac_sync_run",
      level: report.errors.length ? "warn" : "info",
      meta: report,
    },
  });

  console.log(
    JSON.stringify(
      {
        upserted: report.upserted.length,
        errors: report.errors.length,
        discovery: report.discovery,
      },
      null,
      2
    )
  );
  await prisma.$disconnect();
}

main().catch(async (e) => {
  console.error(e);
  process.exit(1);
});
