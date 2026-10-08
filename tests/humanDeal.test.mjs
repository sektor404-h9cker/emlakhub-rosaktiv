import test from "node:test";
import assert from "node:assert/strict";
import {
  asksStillOpen,
  gapBetweenStartAndMarket,
  humanOutcome,
  ladderTone,
} from "../src/lib/analysis/humanDeal.js";
import { classifyDiscovered, listFingerprint } from "../src/lib/herrac/classify.js";
import { computeInvestment } from "../src/lib/analysis/invest.js";
import { emptyAnswers, foldCosts } from "../src/components/terminal/lotStory/foldCosts.js";

test("gap between start and market is a difference, and unknown repair stays a missing ask", () => {
  assert.equal(gapBetweenStartAndMarket(1785, 4700), 2915);
  assert.equal(gapBetweenStartAndMarket(null, 4700), null);
  assert.deepEqual(asksStillOpen(["repair_unknown", "market_unconfirmed"]), [
    "repair_unknown",
    "market_unconfirmed",
  ]);
  assert.equal(
    humanOutcome({
      usableForValuation: true,
      limitReady: false,
      blockedBecause: ["repair_unknown"],
    }),
    "missing"
  );
});

test("a negative engine result is a loss, and a good status is interesting", () => {
  assert.equal(
    humanOutcome({
      usableForValuation: true,
      limitReady: true,
      atBid: { profit: -850, status: "above" },
      blockedBecause: [],
    }),
    "loss"
  );
  assert.equal(
    humanOutcome({
      usableForValuation: true,
      limitReady: true,
      atBid: { profit: 1050, status: "good" },
      blockedBecause: [],
    }),
    "interesting"
  );
  assert.equal(humanOutcome({ usableForValuation: false }), "no_market");
  assert.equal(ladderTone({ profit: -100, status: "above" }), "loss");
  assert.equal(ladderTone({ profit: 1400, status: "good" }), "room");
});

test("VAZ-like numbers stay inside the engine: unknown repair is not profit, a high bid can lose", () => {
  const market = {
    usableForValuation: true,
    marketStatus: "medium",
    marketLow: 4000,
    marketMedian: 4700,
    marketHigh: 5200,
    startPrice: 1785,
    herracFee: 0,
    sellEnabled: true,
    sellPct: 3,
  };
  const unknown = foldCosts("auto", emptyAnswers());
  const blank = computeInvestment({ ...market, bid: 1785, repair: unknown.repair, other: unknown.other, desired: unknown.desired });
  assert.equal(blank.priced, false);
  assert.equal(blank.maxBid.amount, null);
  assert.equal(gapBetweenStartAndMarket(1785, 4700), 2915);
  assert.equal(humanOutcome({ usableForValuation: true, limitReady: false, blockedBecause: blank.blockedBecause }), "missing");
  assert.equal(
    humanOutcome({ usableForValuation: true, limitReady: false, atBid: { profit: 177, status: null } }),
    "pending"
  );

  const filled = foldCosts("auto", {
    ...emptyAnswers(),
    repairChoice: "amount",
    repairAmount: "500",
    reserveChoice: "none",
    extraChoice: "none",
    desiredChoice: "amount",
    desiredAmount: "1000",
  });
  const deal = computeInvestment({
    ...market,
    bid: 1785,
    repair: filled.repair,
    other: filled.other,
    desired: filled.desired,
    desiredMode: filled.desiredMode,
  });
  assert.equal(deal.limitReady, true);
  assert.ok(deal.atBid.profit > 0);
  assert.equal(humanOutcome(deal), "interesting");
  assert.ok(deal.ladder.length >= 2);

  const tight = computeInvestment({
    ...market,
    bid: 1785,
    repair: "500",
    other: "0",
    desired: "3000",
    desiredMode: "amount",
  });
  assert.ok(tight.atBid.profit > 0);
  assert.equal(humanOutcome(tight), "above");

  const tooHigh = computeInvestment({
    ...market,
    bid: 10000,
    repair: "500",
    other: "0",
    desired: "1000",
    desiredMode: "amount",
  });
  assert.ok(tooHigh.atBid.profit < 0);
  assert.equal(humanOutcome(tooHigh), "loss");

  const noMarket = computeInvestment({
    ...market,
    usableForValuation: false,
    marketStatus: "insufficient",
    bid: 1785,
    repair: "500",
    other: "0",
    desired: "1000",
    desiredMode: "amount",
  });
  assert.equal(noMarket.limitReady, false);
  assert.equal(noMarket.maxBid.amount, null);
  assert.equal(humanOutcome(noMarket), "no_market");
});

test("an incomplete Hərrac list does not mark saved lots as absent", () => {
  const existing = new Map([
    ["1", { source: "herrac", listFingerprint: listFingerprint({ startPrice: 10, status: "ONGOING" }) }],
    ["9", { source: "herrac", listFingerprint: null }],
  ]);
  const partial = classifyDiscovered(
    existing,
    [{ id: "2", startPrice: 20, status: "ONGOING" }],
    { complete: false }
  );
  assert.equal(partial.fresh, 1);
  assert.deepEqual(partial.absent, []);

  const full = classifyDiscovered(
    existing,
    [{ id: "1", startPrice: 10, status: "ONGOING" }],
    { complete: true }
  );
  assert.equal(full.unchanged, 1);
  assert.deepEqual(full.absent, ["9"]);
});
