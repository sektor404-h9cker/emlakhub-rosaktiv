import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeInvestment } from "../src/lib/analysis/invest.js";
import { applyPriceOutliers, rateSample } from "../src/lib/markets/engine.js";
import { nameMatchesModel } from "../src/lib/markets/turbo.js";
import { matchesPlace } from "../src/lib/markets/bina.js";
import { ORIGIN_VALUES } from "../src/lib/origin.js";

const market = {
  marketStatus: "medium",
  usableForValuation: true,
  marketLow: 28000,
  marketMedian: 30000,
  marketHigh: 32000,
  startPrice: 15000,
  repair: 2000,
  other: 500,
  herracFee: null,
  deposit: null,
  sellEnabled: false,
  desiredMode: "amount",
  desired: 5000,
  bid: 15000,
};

function amountsHaveOrigin(result) {
  for (const row of result.lines) {
    if (row.amount == null) {
      assert.equal(row.derived, false);
      continue;
    }
    if (row.derived) {
      assert.ok(row.origins?.length);
      for (const origin of row.origins) {
        assert.ok(ORIGIN_VALUES.includes(origin));
        assert.notEqual(origin, "unknown");
      }
    } else {
      assert.ok(ORIGIN_VALUES.includes(row.origin));
      assert.notEqual(row.origin, "unknown");
    }
  }
}

describe("максимальная ставка и прибыль", () => {
  it("сумма 5000 даёт лимит 22500", () => {
    const r = computeInvestment(market);
    assert.equal(r.maxBid.amount, 22500);
    assert.equal(r.targetProfit.amount, 5000);
    assert.match(r.limitSentenceRu, /22 500/);
    assert.equal(r.atBid.profit, 12500);
    assert.equal(r.atBid.roiPct, 71.43);
    assert.equal(r.atBid.status, "good");
  });

  it("ROI 20% на том же примере тоже 22500", () => {
    const r = computeInvestment({ ...market, desiredMode: "pct", desired: 20 });
    assert.equal(r.maxBid.amount, 22500);
    assert.equal(r.targetProfit.amount, 5000);
    const atLimit = r.ladder.find((row) => row.role === "limit");
    assert.equal(atLimit.roiPct, 20);
    assert.equal(atLimit.status, "borderline");
  });

  it("ставка выше лимита не даёт выбранную прибыль", () => {
    const r = computeInvestment({ ...market, bid: 23000 });
    assert.equal(r.atBid.status, "above");
    assert.equal(r.atBid.profit, 4500);
    assert.ok(r.atBid.roiPct < 20);
  });

  it("сценарии берут только p25, медиану и p75", () => {
    const conservative = computeInvestment({ ...market, saleScenario: "conservative" });
    const mid = computeInvestment({ ...market, saleScenario: "market" });
    const optimistic = computeInvestment({ ...market, saleScenario: "optimistic" });
    assert.equal(conservative.saleAnchor.amount, 28000);
    assert.equal(conservative.maxBid.amount, 20500);
    assert.equal(mid.saleAnchor.amount, 30000);
    assert.equal(optimistic.saleAnchor.amount, 32000);
    assert.equal(optimistic.maxBid.amount, 24500);
    assert.equal(conservative.saleAnchor.origin, "market");
  });
});

describe("пустые и нулевые расходы", () => {
  it("пустой ремонт не становится нулём", () => {
    const r = computeInvestment({ ...market, repair: "" });
    assert.equal(r.priced, false);
    assert.ok(r.blockedBecause.includes("repair_unknown"));
    assert.equal(r.maxBid.amount, null);
    assert.equal(r.atBid, null);
    assert.equal(r.costs.repair.amount, null);
    assert.equal(r.costs.repair.origin, "unknown");
  });

  it("ремонт 0, введённый пользователем, входит в формулу", () => {
    const r = computeInvestment({ ...market, repair: 0 });
    assert.equal(r.priced, true);
    assert.equal(r.costs.repair.amount, 0);
    assert.equal(r.costs.repair.origin, "user");
    assert.equal(r.maxBid.amount, 24500);
  });

  it("старое поле repairCost не читается", () => {
    const r = computeInvestment({ ...market, repair: "", repairCost: 9000 });
    assert.equal(r.priced, false);
    assert.ok(r.blockedBecause.includes("repair_unknown"));
    assert.equal(r.maxBid.amount, null);
  });

  it("неизвестный сбор Hərrac не подставляется", () => {
    const r = computeInvestment({ ...market, herracFee: null });
    assert.equal(r.costs.herracFee.amount, null);
    assert.equal(r.costs.herracFee.origin, "unknown");
    assert.equal(r.costs.herracFee.included, false);
    assert.equal(r.maxBid.amount, 22500);
  });

  it("известный сбор входит как herrac_fact и снижает лимит", () => {
    const r = computeInvestment({ ...market, herracFee: 15 });
    assert.equal(r.costs.herracFee.origin, "herrac_fact");
    assert.equal(r.costs.herracFee.included, true);
    assert.equal(r.maxBid.amount, 22485);
  });

  it("задаток показан и в прибыль не входит", () => {
    const r = computeInvestment({ ...market, deposit: 1000, herracFee: 15 });
    assert.equal(r.costs.deposit.origin, "herrac_fact");
    assert.equal(r.costs.deposit.included, false);
    assert.equal(r.maxBid.amount, 22485);
  });

  it("у каждой ненулевой суммы есть origin из общего списка", () => {
    const r = computeInvestment({
      ...market,
      herracFee: 15,
      deposit: 1000,
      sellEnabled: true,
      sellPct: 3,
      sellTouched: false,
    });
    amountsHaveOrigin(r);
    assert.equal(r.costs.sellCost.origin, "assumption");
  });
});

describe("достоверность рынка", () => {
  it("нет рынка — нет лимита", () => {
    const r = computeInvestment({
      ...market,
      marketStatus: "insufficient",
      usableForValuation: false,
      marketMedian: null,
    });
    assert.equal(r.maxBid.amount, null);
    assert.ok(r.blockedBecause.includes("market_unconfirmed"));
  });

  it("низкая достоверность не считается, даже если медиана есть", () => {
    const r = computeInvestment({
      ...market,
      marketStatus: "low",
      usableForValuation: false,
    });
    assert.equal(r.maxBid.amount, null);
    assert.equal(r.market.median.amount, 30000);
    assert.ok(r.blockedBecause.includes("market_low"));
  });

  it("средняя и высокая достоверность считаются", () => {
    for (const marketStatus of ["medium", "high"]) {
      const r = computeInvestment({ ...market, marketStatus, usableForValuation: true });
      assert.equal(r.maxBid.amount, 22500, marketStatus);
    }
  });

  it("источник недоступен — отдельный статус, без чужого текста ошибки", () => {
    const r = computeInvestment({
      ...market,
      marketStatus: "unavailable",
      usableForValuation: false,
    });
    assert.equal(r.maxBid.amount, null);
    assert.ok(r.blockedBecause.includes("market_unavailable"));
    assert.match(r.blockedText[0].ru, /временно недоступны/);
  });

  it("прибыль на максимальной ставке совпадает с желаемой суммой", () => {
    const cases = [
      { sale: 4700, repair: 0, other: 0, fee: 15, sellPct: 3, desired: 3000, bid: 1785 },
      { sale: 125000, repair: 8000, other: 1500, fee: 50, sellPct: 3, desired: 10000, bid: 90000 },
      { sale: 2500000, repair: 400000, other: 25000, fee: 0, sellPct: 3, desired: 150000, bid: 1800000 },
    ];
    for (const row of cases) {
      const r = computeInvestment({
        marketStatus: "high",
        usableForValuation: true,
        marketLow: row.sale - 1000,
        marketMedian: row.sale,
        marketHigh: row.sale + 1000,
        repair: row.repair,
        other: row.other,
        herracFee: row.fee,
        desiredMode: "amount",
        desired: row.desired,
        bid: row.bid,
        sellEnabled: true,
        sellPct: row.sellPct,
        sellTouched: true,
      });
      const atLimit = r.ladder.find((item) => item.role === "limit");
      assert.ok(atLimit, "limit row");
      assert.ok(Math.abs(atLimit.profit - row.desired) <= 0.02, `${atLimit.profit} vs ${row.desired}`);
      const spent = r.atBid.capital - r.atBid.bid;
      assert.equal(r.atBid.profit, Math.round((row.sale - r.atBid.bid - spent) * 100) / 100);
    }
  });

  it("отрицательная ставка не принимается, ноль и ставка выше рынка считаются", () => {
    const base = {
      marketStatus: "high",
      usableForValuation: true,
      marketLow: 4000,
      marketMedian: 4700,
      marketHigh: 5200,
      repair: 0,
      other: 0,
      desiredMode: "amount",
      desired: 500,
      sellEnabled: false,
    };
    const zero = computeInvestment({ ...base, bid: 0 });
    assert.equal(zero.atBid.profit, 4700);
    const above = computeInvestment({ ...base, bid: 6000 });
    assert.ok(above.atBid.profit < 0);
    const bad = computeInvestment({ ...base, bid: -1 });
    assert.equal(bad.atBid, null);
    const unknown = computeInvestment({ ...base, repair: "", bid: 1785 });
    assert.equal(unknown.priced, false);
    assert.equal(unknown.atBid, null);
  });
});

describe("Market Engine", () => {
  it("выброс 40000 не входит в выборку 17–20 тысяч", () => {
    const sample = [17000, 18000, 18000, 19000, 20000, 40000].map((price, i) => ({
      id: String(i),
      price,
    }));
    const out = applyPriceOutliers(sample);
    assert.equal(out.kept.length, 5);
    assert.equal(out.rejected.length, 1);
    assert.equal(out.rejected[0].rejectReason, "price_outlier_high");
    assert.equal(out.rejected[0].price, 40000);
  });

  it("чужая модель не совпадает с Kia Mohave", () => {
    assert.equal(nameMatchesModel("Kia Sportage", "Mohave", { display: "Mohave" }), false);
    assert.equal(nameMatchesModel("Kia Mohave", "Mohave", { display: "Mohave" }), true);
    assert.equal(nameMatchesModel("Kia Cerato", "", null), false);
  });

  it("чужой район не проходит сверку", () => {
    assert.equal(
      matchesPlace({ city: "Bakı", location: "Yasamal r." }, ["nəsimi", "nesimi"]),
      false
    );
    assert.equal(
      matchesPlace({ city: "Bakı", location: "Nəsimi r." }, ["nəsimi", "nesimi"]),
      true
    );
  });

  it("мало аналогов и нет года — insufficient, восемь с годом и пробегом — high", () => {
    const few = rateSample({
      used: 2,
      kind: "auto",
      modelResolved: true,
      yearKnown: true,
      mileageKnown: true,
    });
    assert.equal(few.marketStatus, "insufficient");
    assert.equal(few.usableForValuation, false);

    const strong = rateSample({
      used: 8,
      kind: "auto",
      modelResolved: true,
      yearKnown: true,
      mileageKnown: true,
    });
    assert.equal(strong.marketStatus, "high");
    assert.equal(strong.usableForValuation, true);

    const mid = rateSample({
      used: 5,
      kind: "apartment",
      districtKnown: true,
      areaKnown: true,
      roomsKnown: true,
    });
    assert.equal(mid.marketStatus, "medium");
  });
});
