import assert from "node:assert/strict";
import test from "node:test";
import { computeInvestment } from "../src/lib/analysis/invest.js";
import { azn, buildEmlakIntelligence } from "../src/lib/intelligence/build.js";
import { INTELLIGENCE_RULES } from "../src/lib/productRules.js";
import { parseEstateIdentity } from "../src/lib/markets/estateIdentity.js";

test("completeness weights sum to 100", () => {
  for (const [name, rows] of Object.entries(INTELLIGENCE_RULES.profiles)) {
    const sum = rows.reduce((total, row) => total + row.weight, 0);
    assert.equal(sum, 100, name);
  }
});

test("auto without a year does not get a market price or a score", () => {
  const lot = autoLot({ year: null, startPrice: 20570 });
  const market = sample({
    marketStatus: "insufficient",
    marketStatusReasonRu: "Год автомобиля не указан.",
    counts: { found: 32, accepted: 0, rejected: 0, used: 0 },
    stats: { usableForValuation: false, p25: 18000, medianPrice: 20000, p75: 24000 },
  });
  const intel = buildEmlakIntelligence({
    lot,
    comps: market,
    investment: invest(lot, market),
  });

  assert.equal(intel.dealStatus, "insufficient_data");
  assert.equal(intel.emlakScore, null);
  assert.equal(intel.scoreEligibility.allowed, false);
  assert.equal(intel.marketConfidence.range, null);
  assert.match(intel.why.market.ru, /32/);
  assert.match(intel.why.market.ru, /год/i);
  assert.match(intel.why.status.ru, /Рыночную цену не показываем/);
  assert.doesNotMatch(intel.why.status.ru, /₼/);
  assert.ok(intel.nextActions.some((item) => item.id === "ask_year"));
  assert.equal(intel.flow.showCalculation, false);
});

test("auto with a solid sample can be scored after the investor enters numbers", () => {
  const lot = autoLot({ startPrice: 10000 });
  const market = goodMarket();
  const investment = invest(lot, market, { repair: "0", other: "0", desired: "3000" });
  const intel = buildEmlakIntelligence({ lot, comps: market, investment });

  assert.equal(intel.marketConfidence.level, "high");
  assert.equal(intel.dealStatus, "fits");
  assert.equal(intel.scoreEligibility.allowed, true);
  assert.equal(typeof intel.emlakScore, "number");
  assert.ok(intel.emlakScore >= 0 && intel.emlakScore <= 100);
  assert.equal(intel.flow.showCalculation, true);
  assert.ok(intel.pillars.completeness.earned.some((row) => row.id === "year"));
  assert.ok(intel.pillars.market.value === 100);
});

test("apartment with a medium market and no expenses is potential, not a score", () => {
  const lot = apartmentLot({ startPrice: 50000 });
  const market = sample({
    marketStatus: "medium",
    source: "bina.az",
    counts: { found: 24, accepted: 6, rejected: 18, used: 6 },
    stats: { usableForValuation: true, p25: 114999, medianPrice: 123500, p75: 132000 },
    marketStatusReasonRu: "Использовано 6 объявлений.",
    marketStatusReasonAz: "6 elan.",
  });
  const intel = buildEmlakIntelligence({
    lot,
    comps: market,
    investment: invest(lot, market),
  });

  assert.equal(intel.marketConfidence.level, "medium");
  assert.equal(intel.dealStatus, "potential");
  assert.equal(intel.emlakScore, null);
  assert.match(intel.why.status.ru, new RegExp(escapeRe(azn(123500))));
  assert.match(intel.why.status.ru, new RegExp(escapeRe(azn(50000))));
  assert.match(intel.why.status.ru, /Ремонт ещё не указан/);
  assert.equal(intel.flow.showCalculation, false);
});

test("unavailable market stays unavailable and blocks the score", () => {
  const lot = autoLot({ startPrice: 8000 });
  const market = sample({
    marketStatus: "unavailable",
    marketStatusReasonRu: "Рыночные данные временно недоступны. Попробуйте позже.",
    marketStatusReasonAz: "Bazar məlumatı müvəqqəti əlçatan deyil.",
    stats: { usableForValuation: false, p25: null, medianPrice: null, p75: null },
  });
  const intel = buildEmlakIntelligence({
    lot,
    comps: market,
    investment: invest(lot, market, { repair: "0", other: "0", desired: "1000" }),
  });

  assert.equal(intel.dealStatus, "market_unavailable");
  assert.equal(intel.emlakScore, null);
  assert.match(intel.why.status.ru, /временно недоступны/);
  assert.equal(intel.marketConfidence.range, null);
  assert.equal(intel.flow.showCalculation, false);
});

test("missing expenses do not become zero and do not open a limit", () => {
  const lot = autoLot({ startPrice: 10000 });
  const market = goodMarket();
  const investment = invest(lot, market, { repair: "", other: "", desired: "" });
  const intel = buildEmlakIntelligence({ lot, comps: market, investment });

  assert.equal(investment.priced, false);
  assert.equal(intel.dealStatus, "potential");
  assert.equal(intel.emlakScore, null);
  assert.equal(intel.flow.showCalculation, false);
  assert.ok(intel.unknowns.some((item) => item.id === "expenses"));
});

test("an explicit zero expense is a real input", () => {
  const lot = autoLot({ startPrice: 10000, fee: 0 });
  const market = goodMarket();
  const investment = invest(lot, market, { repair: "0", other: "0", desired: "1000" });
  const intel = buildEmlakIntelligence({ lot, comps: market, investment });

  assert.equal(investment.costs.repair.origin, "user");
  assert.equal(investment.costs.repair.amount, 0);
  assert.equal(intel.scoreEligibility.allowed, true);
  assert.notEqual(intel.dealStatus, "insufficient_data");
  assert.equal(typeof intel.emlakScore, "number");
});

test("a Hərrac sentence about a dead engine is a confirmed quote", () => {
  const lot = autoLot({
    notes: "Mühərrik işlək deyil. Dayanacaqda yerləşir.",
  });
  const intel = buildEmlakIntelligence({
    lot,
    comps: sample(),
    investment: invest(lot, sample()),
  });
  const hit = intel.riskState.confirmed.find((item) => item.id === "engine_dead");

  assert.ok(hit);
  assert.match(hit.quote, /işlək deyil/);
  assert.equal(
    intel.riskState.unknown.some((item) => item.id === "technical_condition"),
    false
  );
  assert.match(intel.why.risks.ru, /işlək deyil/);
});

test("a missing engine is unknown, not a broken engine", () => {
  const lot = autoLot({
    engine: null,
    notes: "Avtomobil dayanacaqdadır.",
  });
  const intel = buildEmlakIntelligence({
    lot,
    comps: sample(),
    investment: invest(lot, sample()),
  });

  assert.equal(
    intel.riskState.confirmed.some((item) => item.id === "engine_dead"),
    false
  );
  const zone = intel.riskState.unknown.find((item) => item.id === "technical_condition");
  assert.ok(zone);
  assert.match(zone.labelRu, /не значит, что он сломан/);
  assert.doesNotMatch(intel.why.risks.ru, /сломан/);
});

test("a start far below the market is potential and the gap uses those two numbers", () => {
  const lot = autoLot({ startPrice: 10000 });
  const market = goodMarket();
  const intel = buildEmlakIntelligence({
    lot,
    comps: market,
    investment: invest(lot, market),
  });

  assert.equal(intel.dealStatus, "potential");
  assert.match(intel.why.status.ru, new RegExp(escapeRe(azn(20000))));
  assert.match(intel.why.status.ru, new RegExp(escapeRe(azn(10000))));
  assert.match(intel.why.status.ru, new RegExp(escapeRe(azn(10000))));
  assert.equal(intel.emlakScore, null);
});

test("a bid exactly on the limit is borderline", () => {
  const lot = autoLot({ startPrice: 10000 });
  const market = goodMarket();
  const preview = invest(lot, market, { repair: "0", other: "0", desired: "3000" });
  const investment = invest(lot, market, {
    repair: "0",
    other: "0",
    desired: "3000",
    bid: String(preview.maxBid.amount),
  });
  const intel = buildEmlakIntelligence({ lot, comps: market, investment });

  assert.equal(investment.atBid.status, "borderline");
  assert.equal(intel.dealStatus, "borderline");
  assert.equal(intel.scoreEligibility.allowed, true);
});

test("a bid above the investor limit is above, and the score is still earned", () => {
  const lot = autoLot({ startPrice: 30000 });
  const market = goodMarket();
  const investment = invest(lot, market, {
    repair: "2000",
    other: "500",
    desired: "5000",
    bid: "30000",
  });
  const intel = buildEmlakIntelligence({ lot, comps: market, investment });

  assert.equal(investment.atBid.status, "above");
  assert.equal(intel.dealStatus, "above");
  assert.equal(intel.scoreEligibility.allowed, true);
  assert.equal(typeof intel.emlakScore, "number");
  assert.equal(intel.flow.showCalculation, true);
});

test("stale database fields do not create an Emlak Score", () => {
  const lot = autoLot({
    year: null,
    startPrice: 8000,
    score: 92,
    repairCost: 0,
    expectedProfit: 5000,
    expectedMarginPct: 40,
    redFlags: ["invented"],
    lastIntelHeadline: "Выгодный лот",
  });
  const market = sample({
    counts: { found: 4, accepted: 0, rejected: 4, used: 0 },
    marketStatusReasonRu: "Год автомобиля не указан. Без него близкий год не отобрать, рыночную цену не даём.",
  });
  const intel = buildEmlakIntelligence({
    lot,
    comps: market,
    investment: invest(lot, market),
  });
  const blob = JSON.stringify({
    score: intel.emlakScore,
    why: intel.why,
    status: intel.dealStatus,
  });

  assert.equal(intel.emlakScore, null);
  assert.equal(intel.scoreEligibility.allowed, false);
  assert.doesNotMatch(blob, /"score":92/);
  assert.doesNotMatch(intel.why.score.ru, /92/);
  assert.doesNotMatch(intel.why.status.ru, /5\s?000/);
  assert.doesNotMatch(intel.why.status.ru, /Выгодный/);
});

test("every explanation stays inside the facts of that lot", () => {
  const lot = autoLot({ year: null, mileageKm: null, engine: null, vin: null, startPrice: 6888 });
  const market = sample({
    counts: { found: 26, accepted: 0, rejected: 0, used: 0 },
    marketStatusReasonRu: "Год автомобиля не указан.",
  });
  const intel = buildEmlakIntelligence({
    lot,
    comps: market,
    investment: invest(lot, market),
  });

  assert.match(intel.mainReason.ru, /26/);
  assert.match(intel.why.score.ru, /год/i);
  assert.equal(intel.marketConfidence.range, null);
  for (const row of intel.riskState.confirmed) {
    assert.ok(String(lot.notes).includes(row.quote) || String(lot.condition || "").includes(row.quote));
  }
  assert.ok(intel.unknowns.some((item) => item.id === "year"));
  assert.ok(intel.dataCompleteness.missed.some((item) => item.id === "year"));
});

function autoLot(overrides = {}) {
  return {
    market: "auto",
    titleAz: 'Avtomobil - "BMW 528i" minik markalı',
    year: 2014,
    mileageKm: 120000,
    engine: "2.0",
    vin: "WBA00000000000001",
    notes: "Qeyd: sənəd yoxdur, amma bu mətndə yazılıb.",
    photos: ["https://example.test/1.jpg"],
    startAt: "2026-09-01T10:00:00.000Z",
    deposit: 1000,
    fee: 15,
    districtAz: "Bakı, Nəsimi",
    startPrice: 10000,
    params: {},
    ...overrides,
  };
}

function apartmentLot(overrides = {}) {
  return {
    market: "estate",
    categoryName: "Mənzil",
    titleAz: "Mənzil, Nəsimi",
    areaSqm: 32.5,
    rooms: 1,
    floor: 4,
    districtAz: "Bakı Nəsimi Süleyman Rəhimov ev 129",
    cityAz: "Bakı",
    buildingType: "Köhnə",
    condition: "Təmirsiz",
    titleDoc: "Çıxarış",
    notes: "Evdə yaşayış var",
    photos: ["https://example.test/a.jpg"],
    startAt: "2026-09-22T09:36:00.000Z",
    deposit: 2640,
    fee: 15,
    startPrice: 52813,
    params: {},
    ...overrides,
  };
}

function sample(overrides = {}) {
  return {
    marketStatus: "insufficient",
    marketStatusReasonRu: "Надёжного ориентира нет.",
    marketStatusReasonAz: "Etibarlı orientir yoxdur.",
    counts: { found: 0, accepted: 0, rejected: 0, used: 0 },
    stats: { usableForValuation: false, p25: null, medianPrice: null, p75: null },
    source: "turbo.az",
    fetchedAt: "2026-10-07T10:00:00.000Z",
    ...overrides,
    stats: {
      usableForValuation: false,
      p25: null,
      medianPrice: null,
      p75: null,
      ...(overrides.stats || {}),
    },
    counts: {
      found: 0,
      accepted: 0,
      rejected: 0,
      used: 0,
      ...(overrides.counts || {}),
    },
  };
}

function goodMarket() {
  return sample({
    marketStatus: "high",
    marketStatusReasonRu: "Использовано 12 объявлений той же модели.",
    marketStatusReasonAz: "Eyni modeldən 12 elan.",
    counts: { found: 20, accepted: 12, rejected: 8, used: 12 },
    stats: { usableForValuation: true, p25: 18000, medianPrice: 20000, p75: 23000 },
  });
}

function invest(lot, market, costs = {}) {
  return computeInvestment({
    marketStatus: market.marketStatus,
    usableForValuation: Boolean(market.stats.usableForValuation),
    marketLow: market.stats.p25,
    marketMedian: market.stats.medianPrice,
    marketHigh: market.stats.p75,
    saleScenario: "market",
    repair: costs.repair ?? "",
    other: costs.other ?? "",
    herracFee: lot.fee ?? null,
    deposit: lot.deposit ?? null,
    startPrice: lot.startPrice,
    bid: costs.bid ?? (lot.startPrice == null ? "" : String(lot.startPrice)),
    desiredMode: "amount",
    desired: costs.desired ?? "",
    sellEnabled: false,
    sellTouched: true,
    saleBasis: costs.saleBasis,
    userSale: costs.userSale ?? "",
  });
}

test("estate identity keeps Xırdalan and Yevlax out of the Baku market", () => {
  const xirdalan = parseEstateIdentity({
    market: "estate",
    titleAz: "Mənzil - Bakı şəhəri, Xırdalan şəhəri, ev 4, mənzil 12",
    cityAz: "Bakı",
    areaSqm: 64,
    rooms: 2,
  });
  assert.equal(xirdalan.city, "Xırdalan");
  assert.equal(xirdalan.kind, "apartment");
  assert.equal(xirdalan.placeKey, null);

  const yevlax = parseEstateIdentity({
    market: "estate",
    titleAz: "Mənzil - Yevlax şəhəri, 3 otaq, 78.4 m2",
    cityAz: "Yevlax",
  });
  assert.equal(yevlax.city, "Yevlax");
  assert.equal(yevlax.rooms, 3);
  assert.equal(yevlax.areaSqm, 78.4);

  const baku = parseEstateIdentity({
    market: "estate",
    titleAz: "Mənzil - Bakı şəhəri, Nəsimi rayonu, 2 otaq, 55 m2",
    cityAz: "Bakı",
  });
  assert.equal(baku.city, "Bakı");
  assert.equal(baku.placeKey, "nesimi");

  const house = parseEstateIdentity({
    market: "land",
    titleAz: "Fərdi yaşayış evi - Yevlax rayonu, 0.30 ha torpaq sahəsi ilə birlikdə",
    cityAz: "Yevlax",
  });
  assert.equal(house.kind, "house");
  assert.equal(house.city, "Yevlax");
});

test("apartment without a confirmed market still prices the investor scenario", () => {
  const lot = apartmentLot({ startPrice: 60000, cityAz: "Yevlax", titleAz: "Mənzil, Yevlax" });
  const market = sample({
    marketStatus: "insufficient",
    marketStatusReasonRu: "Для «Yevlax» рынок bina.az не подменяем рынком Баку.",
    counts: { found: 0, accepted: 0, rejected: 0, used: 0 },
  });
  const waiting = buildEmlakIntelligence({
    lot,
    comps: market,
    investment: invest(lot, market),
  });
  assert.equal(waiting.dealStatus, "insufficient_data");
  assert.equal(waiting.emlakScore, null);
  assert.match(waiting.dealStatusLabel.ru, /не подтвержд/);
  assert.match(waiting.why.status.ru, /Yevlax|Баку/);
  assert.ok(waiting.nextActions.some((item) => item.id === "enter_own_price"));

  const investment = invest(lot, market, {
    saleBasis: "user",
    userSale: "90000",
    repair: "5000",
    other: "0",
    desired: "10000",
    bid: "60000",
  });
  const intel = buildEmlakIntelligence({ lot, comps: market, investment });
  assert.equal(intel.dealStatus, "own_scenario");
  assert.equal(intel.emlakScore, null);
  assert.equal(intel.flow.showCalculation, true);
  assert.equal(investment.saleSource, "user");
  assert.ok(investment.atBid.profit > 0);
  assert.match(intel.why.status.ru, /не подтвердил/);
  assert.doesNotMatch(intel.why.score.ru, /Оценка \d+ из 100/);
});

function escapeRe(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
