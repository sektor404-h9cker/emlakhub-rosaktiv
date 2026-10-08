import assert from "node:assert/strict";
import test from "node:test";
import { buildHerracFacts } from "../src/components/terminal/lotStory/herracFacts.js";

const vaz = {
  market: "auto",
  titleAz:
    'Avtomobil - VAZ 21214" minik markalı, 90-EN-544 dövlət qeydiyyat nişanlı nəqliyyat vasitəsi',
  cityAz: "Bakı",
  startAt: "2026-09-27T10:35:13.07717",
  validUntil: "2026-10-04T10:39:12.762538",
  deposit: 680,
  fee: 15,
  lotPrice: 8000,
  minSalePrice: 6800,
  lastBidPrice: 6888,
  minBidIncrement: 68,
  maxBidIncrement: 204,
  herracStatus: "WINNER",
  attendanceStatus: "COMPLETED",
  attendantsCount: 2,
  categoryName: "Avtomobillər",
  roundLabel: "İlkin hərrac",
  lotLocation: "https://maps.google.com/?q=40.400055,49.930016",
  lotDataHighlight: "2014 , 1690.0 , 232000 km",
  params: {
    "Əmlakın yerləşdiyi şəhər və ya rayon": "Bakı",
    "Əmlakın yerləşdiyi ünvan":
      "Bakı şəhəri, Nizami rayonu, Keşlə qəsəbəsi, Mikayıl Əliyev küçəsi Xəmsə cərimə meydançası",
    "Buraxılış ili": "2014",
    "Ban növü": "universal",
    "Ban nömrəsi": "XTA212140E2201920",
    Rəng: "Boz parıltısız",
    "Yanacaq növü": "Benzin",
    Mühərrik: "1690.0",
    "Yürüş(km)": "232000",
    "Sürətlər qutusu": "mexanika",
    Yeni: "Xeyr",
    "Əlavə məlumat":
      "Cərimə meydançasında və ya digər yerdə saxlanma xərci - 100 manat, İnzibati Cərimələri - Məlumat yoxdur",
    "Əlavə qeyd": "Açar və qeydiyyat şəhadətnaməsi yoxdur. Dayanacaqda yerləşir istifadə edilmir.",
  },
};

test("пустые поля VAZ не превращаются в значения", () => {
  const facts = buildHerracFacts(
    { market: "auto", titleAz: "VAZ", params: { "Buraxılış ili": "2014", "Ban nömrəsi": null } },
    { az: false, locale: "ru" }
  );
  const ids = facts.sections.flatMap((section) => section.rows.map((row) => row.id));
  assert.equal(ids.includes("vin"), false);
  assert.equal(ids.includes("mileage"), false);
  assert.equal(ids.includes("deposit"), false);
  assert.ok(ids.includes("year"));
});

test("VAZ показывает пришедшие поля и не выдумывает организатора", () => {
  const facts = buildHerracFacts(vaz, { az: false, locale: "ru" });
  const rows = facts.sections.flatMap((section) => section.rows);
  const byId = Object.fromEntries(rows.map((row) => [row.id, row.value]));
  assert.equal(byId.year, "2014");
  assert.equal(byId.vin, "XTA212140E2201920");
  assert.equal(byId.plate, "90-EN-544");
  assert.match(byId.mileage, /232/);
  assert.equal(byId.engine, "1690.0");
  assert.match(byId.place, /Xəmsə/);
  assert.match(byId.note, /qeydiyyat şəhadətnaməsi yoxdur/);
  assert.equal(byId.deposit, "680 ₼");
  assert.equal(byId.fee, "15 ₼");
  assert.equal(facts.highlights.length <= 7, true);
  assert.equal(facts.highlights.length >= 5, true);
  assert.equal(rows.some((row) => /организатор|satıcı/i.test(row.labelRu + row.value)), false);
  assert.equal(rows.some((row) => /обременен/i.test(row.labelRu)), false);
});

test("квартира показывает адрес, площадь, комнаты и этаж, если они есть", () => {
  const facts = buildHerracFacts(
    {
      market: "estate",
      deposit: 2640.62,
      titleDoc: "Çıxarış",
      params: {
        "Otaq sayı": "1",
        "Sahəsi(m2)": "32.5",
        Vəziyyəti: "Təmirsiz",
        Mərtəbəsi: "4",
        "Tikilinin növü": "Köhnə",
        "Əmlakın yerləşdiyi ünvan": "Bakı şəhəri, Nəsimi rayonu, Süleyman Rəhimov küçəsi, ev 129, mənzil 27.",
        "Hüquq müəyyən edici sənəd": "Çıxarış",
      },
    },
    { az: false, locale: "ru" }
  );
  const ids = facts.highlights.map((item) => item.id);
  assert.ok(ids.includes("place"));
  assert.ok(ids.includes("area"));
  assert.ok(ids.includes("rooms"));
  assert.ok(ids.includes("floor"));
  assert.equal(ids.includes("vin"), false);
});
