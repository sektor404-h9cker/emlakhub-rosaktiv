import test from "node:test";
import assert from "node:assert/strict";
import { computeInvestment } from "../src/lib/analysis/invest.js";
import { humanOutcome } from "../src/lib/analysis/humanDeal.js";
import { emptyAnswers, foldCosts, foldUserSale } from "../src/components/terminal/lotStory/foldCosts.js";
import { sanitizeScenarioInputs } from "../src/lib/scenarios/shape.js";

const confirmed = {
  marketStatus: "high",
  usableForValuation: true,
  marketLow: 4500,
  marketMedian: 5000,
  marketHigh: 5600,
  repair: 0,
  other: 0,
  herracFee: 15,
  desiredMode: "amount",
  desired: 500,
  bid: 1785,
  sellEnabled: true,
  sellPct: 3,
  sellTouched: true,
};

const unconfirmed = {
  ...confirmed,
  marketStatus: "insufficient",
  usableForValuation: false,
  marketLow: null,
  marketMedian: null,
  marketHigh: null,
};

test("подтверждённый рынок остаётся базой расчёта", () => {
  const result = computeInvestment(confirmed);
  assert.equal(result.priced, true);
  assert.equal(result.saleSource, "market");
  assert.equal(result.saleAnchor.origin, "market");
  assert.equal(result.saleAnchor.amount, 5000);
  assert.equal(result.atBid.profit, result.saleAnchor.amount - result.atBid.capital);
  assert.equal(humanOutcome(result), "interesting");
});

test("без рынка своя цена продажи считает прибыль и не называется рынком", () => {
  const result = computeInvestment({ ...unconfirmed, userSale: 4700 });
  assert.equal(result.priced, true);
  assert.equal(result.saleSource, "user");
  assert.equal(result.saleAnchor.origin, "user");
  assert.equal(result.saleAnchor.amount, 4700);
  assert.equal(result.usableForValuation, false);
  assert.ok(result.atBid.profit != null);
  assert.equal(humanOutcome(result) === "no_market", false);
  assert.match(result.saleAnchor.labelRu, /указанная вами/);
});

test("без рынка и без своей цены прибыль не появляется", () => {
  const result = computeInvestment(unconfirmed);
  assert.equal(result.priced, false);
  assert.equal(result.atBid, null);
  assert.equal(result.maxBid.amount, null);
  assert.ok(result.blockedBecause.includes("user_sale_unknown"));
  assert.ok(result.blockedBecause.includes("market_unconfirmed"));
  assert.match(result.blockedText.find((row) => row.id === "user_sale_unknown").ru, /предполагаемую цену продажи/);
  assert.equal(humanOutcome(result), "no_market");
});

test("явный ноль расходов не равен неизвестным расходам", () => {
  const zero = computeInvestment({ ...unconfirmed, userSale: 4000, repair: 0, other: 0, desired: 100 });
  const unknown = computeInvestment({ ...unconfirmed, userSale: 4000, repair: "", other: "", desired: 100 });
  assert.equal(zero.priced, true);
  assert.equal(zero.costs.repair.amount, 0);
  assert.equal(zero.costs.other.amount, 0);
  assert.ok(zero.atBid.profit != null);
  assert.equal(unknown.priced, false);
  assert.equal(unknown.atBid, null);
  assert.equal(unknown.costs.repair.amount, null);
  assert.ok(unknown.blockedBecause.includes("repair_unknown"));
  assert.match(unknown.blockedText.find((row) => row.id === "repair_unknown").ru, /Не знаю/);
  assert.match(unknown.blockedText.find((row) => row.id === "other_unknown").ru, /дополнительные расходы/);
});

test("отрицательный результат и продажа ниже покупки не прячутся", () => {
  const loss = computeInvestment({ ...confirmed, bid: 6000, desired: 100 });
  assert.ok(loss.atBid.profit < 0);
  assert.equal(humanOutcome(loss), "loss");

  const below = computeInvestment({ ...unconfirmed, userSale: 1500, bid: 1785, repair: 0, other: 0, desired: 100 });
  assert.ok(below.atBid.profit < 0);
  assert.equal(below.saleAnchor.amount, 1500);
  assert.equal(humanOutcome(below), "loss");
});

test("изменение ремонта пересчитывает прибыль", () => {
  const lowRepair = computeInvestment({ ...unconfirmed, userSale: 5000, repair: 100, other: 0, desired: 200 });
  const highRepair = computeInvestment({ ...unconfirmed, userSale: 5000, repair: 900, other: 0, desired: 200 });
  assert.ok(highRepair.atBid.profit < lowRepair.atBid.profit);
  assert.equal(lowRepair.atBid.profit - highRepair.atBid.profit, 800);
});

test("сохранение и повторное открытие воспроизводят ту же прибыль", () => {
  const answers = {
    ...emptyAnswers(),
    repairChoice: "amount",
    repairAmount: "500",
    reserveChoice: "none",
    extraChoice: "none",
    desiredChoice: "amount",
    desiredAmount: "300",
    userSaleAmount: "4700",
  };
  const saved = sanitizeScenarioInputs(answers);
  assert.equal(saved.userSaleAmount, "4700");
  const again = { ...emptyAnswers(), ...saved };
  const folded = foldCosts("auto", again);
  const opened = computeInvestment({
    ...unconfirmed,
    repair: folded.repair,
    other: folded.other,
    desired: folded.desired,
    desiredMode: folded.desiredMode,
    userSale: foldUserSale(again),
    bid: 1785,
  });
  const first = computeInvestment({
    ...unconfirmed,
    repair: "500",
    other: "0",
    desired: "300",
    desiredMode: "amount",
    userSale: "4700",
    bid: 1785,
  });
  assert.equal(opened.atBid.profit, first.atBid.profit);
  assert.equal(opened.saleSource, "user");
});

test("своя цена не подменяет подтверждённый рынок и считается отдельно", () => {
  const byMarket = computeInvestment({ ...confirmed, userSale: 4300, saleBasis: "market" });
  const byUser = computeInvestment({ ...confirmed, userSale: 4300, saleBasis: "user" });

  assert.equal(byMarket.saleSource, "market");
  assert.equal(byMarket.saleAnchor.amount, 5000);
  assert.equal(byMarket.saleAnchor.origin, "market");
  assert.equal(byMarket.market.median.amount, 5000);

  assert.equal(byUser.saleSource, "user");
  assert.equal(byUser.saleAnchor.amount, 4300);
  assert.equal(byUser.saleAnchor.origin, "user");
  assert.equal(byUser.market.median.amount, 5000);
  assert.equal(byUser.usableForValuation, true);
  assert.equal(byUser.costs.herracFee.amount, 15);
  assert.equal(byUser.costs.sellCost.amount, 129);
  const spent = byUser.atBid.capital - byUser.atBid.bid;
  assert.equal(spent, 15 + 129);
  assert.equal(byUser.atBid.profit, 4300 - 1785 - spent);
  assert.ok(byUser.atBid.profit < byMarket.atBid.profit);
  assert.equal(byUser.maxBid.amount, 4300 - spent - 500);

  const impossible = computeInvestment({ ...confirmed, userSale: 4300, saleBasis: "user", desired: 4200 });
  assert.equal(impossible.maxBid.amount, null);
  assert.equal(impossible.limitReady, false);
  assert.ok(impossible.desiredBlockedBecause.includes("goal_unreachable"));
  assert.equal(impossible.atBid.profit, 4300 - 1785 - (15 + 129));

  const saved = sanitizeScenarioInputs({ ...emptyAnswers(), saleBasis: "user", userSaleAmount: "4300" });
  assert.equal(saved.saleBasis, "user");
  assert.equal(saved.userSaleAmount, "4300");
});

test("автомобиль и недвижимость складывают свои расходы и считают свою цену продажи", () => {
  const auto = foldCosts("auto", {
    ...emptyAnswers(),
    repairChoice: "zero",
    reserveChoice: "1000",
    extraChoice: "none",
    desiredChoice: "3000",
    userSaleAmount: "8000",
  });
  const estate = foldCosts("estate", {
    ...emptyAnswers(),
    repairChoice: "amount",
    repairAmount: "4000",
    paperworkChoice: "amount",
    paperworkAmount: "200",
    commissionChoice: "none",
    extraChoice: "none",
    desiredChoice: "pct20",
    userSaleAmount: "120000",
  });
  assert.equal(auto.repair, "0");
  assert.equal(auto.other, "1000");
  assert.equal(estate.repair, "4000");
  assert.equal(estate.other, "200");

  const autoDeal = computeInvestment({
    ...unconfirmed,
    repair: auto.repair,
    other: auto.other,
    desired: auto.desired,
    desiredMode: auto.desiredMode,
    userSale: "8000",
    bid: 2000,
  });
  const estateDeal = computeInvestment({
    ...unconfirmed,
    repair: estate.repair,
    other: estate.other,
    desired: estate.desired,
    desiredMode: estate.desiredMode,
    userSale: "120000",
    bid: 80000,
    herracFee: 50,
  });
  assert.equal(autoDeal.priced, true);
  assert.equal(autoDeal.costs.other.amount, 1000);
  assert.equal(estateDeal.priced, true);
  assert.equal(estateDeal.saleSource, "user");
  assert.ok(estateDeal.atBid.profit != null);
  assert.equal(estateDeal.usableForValuation, false);
});
