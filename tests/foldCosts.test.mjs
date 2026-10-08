import test from "node:test";
import assert from "node:assert/strict";
import { emptyAnswers, foldCosts } from "../src/components/terminal/lotStory/foldCosts.js";

test("пустые ответы не становятся нулём", () => {
  const folded = foldCosts("auto", emptyAnswers());
  assert.equal(folded.repair, "");
  assert.equal(folded.other, "");
  assert.equal(folded.desired, "");
});

test("явный ноль ремонта и «нет» по остальным расходам дают 0", () => {
  const answers = {
    ...emptyAnswers(),
    repairChoice: "zero",
    reserveChoice: "none",
    extraChoice: "none",
    desiredChoice: "3000",
  };
  const folded = foldCosts("auto", answers);
  assert.equal(folded.repair, "0");
  assert.equal(folded.other, "0");
  assert.equal(folded.desired, "3000");
  assert.equal(folded.desiredMode, "amount");
});

test("неизвестный запас не даёт сложить остальные расходы в ноль", () => {
  const answers = {
    ...emptyAnswers(),
    repairChoice: "amount",
    repairAmount: "2000",
    reserveChoice: "unknown",
    extraChoice: "none",
  };
  const folded = foldCosts("auto", answers);
  assert.equal(folded.repair, "2000");
  assert.equal(folded.other, "");
});

test("квартира складывает оформление, комиссию и прочие только когда все известны", () => {
  const answers = {
    ...emptyAnswers(),
    repairChoice: "amount",
    repairAmount: "5000",
    paperworkChoice: "amount",
    paperworkAmount: "300",
    commissionChoice: "none",
    extraChoice: "amount",
    extraAmount: "200",
  };
  const folded = foldCosts("estate", answers);
  assert.equal(folded.repair, "5000");
  assert.equal(folded.other, "500");
});

test("земля: подготовка идёт в ремонт, оформление и прочие — в остальные расходы", () => {
  const answers = {
    ...emptyAnswers(),
    prepChoice: "amount",
    prepAmount: "1000",
    paperworkChoice: "zero",
    extraChoice: "none",
    desiredChoice: "pct20",
  };
  const folded = foldCosts("land", answers);
  assert.equal(folded.repair, "1000");
  assert.equal(folded.other, "0");
  assert.equal(folded.desiredMode, "pct");
  assert.equal(folded.desired, "20");
});
