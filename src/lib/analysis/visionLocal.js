/**
 * Vision-модуль неактивен как модель по фото.
 *
 * Пиксельный разбор не подключён и не должен притворяться работающим.
 * runLocalVision только читает текст карточки Hərrac и не назначает стоимость ремонта.
 * Будущая модель подключается здесь, не в Investment Engine.
 */

import { ORIGIN } from "../origin";

const NOTE_PATTERNS = [
  {
    id: "no_keys",
    re: /borcluda|у должника|документ.*должник/i,
    severity: "high",
    labelAz: "Açar / sənəd borcluda",
    labelRu: "Ключи или документы у должника",
    zone: { x: 8, y: 12, w: 28, h: 14 },
    whyAz: "Herrac qeydində açar/sənəd borcluda yazılıb.",
    whyRu: "В заметке herrac прямо сказано про ключи/документы у должника.",
    nextAz: "Beh verməzdən əvvəl girişi və açarı dəqiqləşdirin.",
    nextRu: "До задатка уточните доступ и где ключи.",
  },
  {
    id: "engine_dead",
    re: /mühərrik.*işlək deyil|işlək deyil|двигател.*(не\s*работа|неисправ)|motor.*işləmir|sıradan çıx/i,
    severity: "high",
    labelAz: "Mühərrik / aqreqat işlək deyil",
    labelRu: "Двигатель / агрегат не работает",
    zone: { x: 35, y: 40, w: 30, h: 22 },
    whyAz: "Mətndə mühərrikin/texnikanın işləmədiyi yazılıb.",
    whyRu: "В тексте лота указано, что двигатель или техника не работает.",
    nextAz: "Dəqiq qiymət üçün diaqnostika lazımdır.",
    nextRu: "Для точной оценки требуется диагностика.",
  },
  {
    id: "flood",
    re: /suda\s*qal|su\s*bas|утоплен|затоп|flood|nəm\s*iy|влаг/i,
    severity: "high",
    labelAz: "Su / nəmlik riski",
    labelRu: "Риск затопления / влаги",
    zone: { x: 40, y: 55, w: 35, h: 20 },
    whyAz: "Mətndə su/nəmlik/basqın siqnalı var.",
    whyRu: "В тексте есть сигнал про воду, влагу или затопление.",
    nextAz: "Dəqiq qiymət üçün diaqnostika lazımdır.",
    nextRu: "Для точной оценки требуется диагностика.",
  },
  {
    id: "flat_tires",
    re: /təkər.*sön|sönmüş\s*təkər|спущен|прокол.*шин|шины?\s*спущен/i,
    severity: "med",
    labelAz: "Təkərlər sönüb",
    labelRu: "Спущенные шины",
    zone: { x: 15, y: 70, w: 25, h: 16 },
    whyAz: "Qeyddə sönmüş təkər / şin problemi yazılıb.",
    whyRu: "В заметке указаны спущенные шины.",
    nextAz: "Dəqiq qiymət üçün diaqnostika lazımdır.",
    nextRu: "Для точной оценки требуется диагностика.",
  },
  {
    id: "body_damage",
    re: /öndən\s*zədə|vuruq|zədə|qəza|dəymiş|поврежд|удар|дтп|разбит|разбита|çat|трещин|ezilmiş/i,
    severity: "high",
    labelAz: "Kuzov / qəza izi",
    labelRu: "Кузов / следы ДТП",
    zone: { x: 30, y: 35, w: 40, h: 25 },
    whyAz: "Mətndə zədə, vuruq və ya qəza sözləri var.",
    whyRu: "В тексте есть слова про удар, повреждение или ДТП.",
    nextAz: "Dəqiq qiymət üçün diaqnostika lazımdır.",
    nextRu: "Для точной оценки требуется диагностика.",
  },
  {
    id: "rust",
    re: /\bpas\b|ржав|korrozi|корроз/i,
    severity: "med",
    labelAz: "Pas / korroziya (mətn)",
    labelRu: "Ржавчина / коррозия (из текста)",
    zone: { x: 55, y: 50, w: 28, h: 18 },
    whyAz: "Herrac mətnində pas/korroziya qeyd olunub — fotoda uydurmuram.",
    whyRu: "В тексте herrac есть ржавчина/коррозия — на фото её не «рисуем».",
    nextAz: "Dəqiq qiymət üçün diaqnostika lazımdır.",
    nextRu: "Для точной оценки требуется диагностика.",
  },
  {
    id: "not_in_use",
    re: /[İi]stifadə\s*(olunmur|edilmir)|не\s*эксплуат|işləmir|долго\s*стоял|uzun\s*dayan/i,
    severity: "med",
    labelAz: "İstismar olunmur / dayanıb",
    labelRu: "Не эксплуатируется / долго стоял",
    zone: { x: 55, y: 55, w: 30, h: 18 },
    whyAz: "Mətndə istifadə olunmur / dayanma siqnalı var.",
    whyRu: "В тексте есть сигнал про простой или неэксплуатацию.",
    nextAz: "Dəqiq qiymət üçün diaqnostika lazımdır.",
    nextRu: "Для точной оценки требуется диагностика.",
  },
  {
    id: "storage_fee",
    re: /saxlanma|штрафплощад|хранен|AZN\/gün|manat.*gün|dayanacaq.*azn/i,
    severity: "med",
    labelAz: "Saxlanma / dayanacaq xərci",
    labelRu: "Платное хранение / стоянка",
    zone: { x: 62, y: 8, w: 28, h: 12 },
    whyAz: "Herrac mətnində saxlanma xərci yazılıb. Gündəlik tarif yalnız mətndə varsa var.",
    whyRu: "В тексте Hərrac назван расход на хранение. Посуточная ставка есть только если она написана.",
    nextAz: "Məbləği mətnin özündən götürün.",
    nextRu: "Сумму берите из текста лота.",
  },
  {
    id: "not_operating",
    re: /fəaliyyət\s*göstərmir|не\s*функционир|не\s*работающ.*объект/i,
    severity: "high",
    labelAz: "Obyekt fəaliyyətsiz",
    labelRu: "Объект не работает",
    zone: { x: 20, y: 30, w: 50, h: 35 },
    whyAz: "Herrac yazır: obyekt fəaliyyət göstərmir.",
    whyRu: "Herrac указывает: объект не функционирует.",
    nextAz: "Dəqiq qiymət üçün diaqnostika lazımdır.",
    nextRu: "Для точной оценки требуется диагностика.",
  },
  {
    id: "paint",
    re: /rənglənm|покраск|boya\s*edilib|перекраш/i,
    severity: "med",
    labelAz: "Rənglənmə qeydi",
    labelRu: "Упоминается покраска",
    zone: { x: 15, y: 45, w: 25, h: 20 },
    whyAz: "Mətndə boya / rənglənmə var.",
    whyRu: "В описании упоминается покраска.",
    nextAz: "Dəqiq qiymət üçün diaqnostika lazımdır.",
    nextRu: "Для точной оценки требуется диагностика.",
  },
  {
    id: "mortgage",
    re: /ipotek|ипотек|həbs|арест|yüklənm|обремен/i,
    severity: "high",
    labelAz: "Hüquqi yüklənmə riski",
    labelRu: "Юридическое обременение",
    zone: { x: 10, y: 70, w: 35, h: 14 },
    whyAz: "Mətndə ipoteka / həbs / yüklənmə var.",
    whyRu: "В тексте есть ипотека, арест или обременение.",
    nextAz: "Hüquqi yoxlama məcburidir.",
    nextRu: "Юридическая проверка обязательна.",
  },
  {
    id: "needs_repair",
    re: /təmir\s*lazım|təmirsiz|требует\s*ремонт|нужен\s*ремонт|космет|orta\s*vəziyyət/i,
    severity: "med",
    labelAz: "Təmir tələb olunur",
    labelRu: "Требуется ремонт",
    zone: { x: 45, y: 40, w: 30, h: 20 },
    whyAz: "Vəziyyət / mətn təmirə işarə edir.",
    whyRu: "Состояние или текст указывают на нужный ремонт.",
    nextAz: "Dəqiq qiymət üçün diaqnostika lazımdır.",
    nextRu: "Для точной оценки требуется диагностика.",
  },
];

const META_EXPLAIN = {
  few_photos: {
    whyAz: "Az foto — gizli detallar görünməyə bilər.",
    whyRu: "Мало фото — скрытые детали могут не попасть в кадр.",
    nextAz: "Əlavə foto və yerində baxış istəyin.",
    nextRu: "Запросите больше фото и осмотр на месте.",
  },
  high_mileage: {
    whyAz: "Yüksək yürüş parametrdə yazılıb.",
    whyRu: "В параметрах указан высокий пробег.",
    nextAz: "Dəqiq qiymət üçün diaqnostika lazımdır.",
    nextRu: "Для точной оценки требуется диагностика.",
  },
  mid_repair: {
    whyAz: "Vəziyyət sahəsində təmir / kosmetika.",
    whyRu: "В поле состояния — ремонт / косметика.",
    nextAz: "Dəqiq qiymət üçün diaqnostika lazımdır.",
    nextRu: "Для точной оценки требуется диагностика.",
  },
  no_text_signals: {
    whyAz:
      "Herrac mətnində zədə/açar/mühərrik siqnalı yoxdur. Fotodakı pası/suyu pikseldən «görmürük» — yerində baxın.",
    whyRu:
      "В тексте herrac нет сигналов про ключи, двигатель, ДТП. Ржавчину и «утопленника» по пикселям не определяем — нужен осмотр.",
    nextAz: "Fotoya baxın özünüz, sonra yerində yoxlayın.",
    nextRu: "Смотрите фото сами глазами, затем осмотр на месте.",
  },
};

function hashZone(seed, i) {
  const x = 10 + ((seed + i * 17) % 55);
  const y = 15 + ((seed + i * 29) % 50);
  return { x, y, w: 18 + (i % 3) * 4, h: 14 + (i % 2) * 4 };
}

function evidenceLabel(evidence, locale) {
  const az = locale === "az";
  if (evidence === "notes_params") {
    return az ? "Mənbə: herrac mətni" : "Источник: текст herrac";
  }
  if (evidence === "photo_meta") {
    return az ? "Mənbə: foto sayı" : "Источник: число фото";
  }
  if (evidence === "params") {
    return az ? "Mənbə: parametrlər" : "Источник: параметры лота";
  }
  if (evidence === "honesty") {
    return az ? "Mənbə: dürüstlük qaydası" : "Источник: правило честности";
  }
  return az ? "Mənbə: törəmə" : "Источник: вывод";
}

export function runLocalVision(lot) {
  const notes = String(lot.notes || lot.payload?.notes || "");
  const params = lot.params || lot.payload?.params || {};
  const paramBlob = Object.entries(params)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
  const blob = `${notes}\n${paramBlob}\n${lot.titleAz || ""}\n${lot.titleRu || ""}`;
  const photos = Array.isArray(lot.photos)
    ? lot.photos
    : lot.payload?.photos || [];
  const photoCount = photos.length || (lot.photo ? 1 : 0);

  const findings = [];
  const unknownRepair = {
    cost: null,
    costOrigin: ORIGIN.UNKNOWN,
    costStatus: "unknown",
    costNoteRu:
      "Стоимость ремонта: неизвестна. Для точной оценки требуется диагностика.",
    costNoteAz:
      "Təmirin dəyəri: məlum deyil. Dəqiq qiymət üçün diaqnostika lazımdır.",
  };
  const noMoney = {
    cost: null,
    costOrigin: ORIGIN.UNKNOWN,
    costStatus: "not_a_repair_quote",
    costNoteRu: null,
    costNoteAz: null,
  };

  for (const p of NOTE_PATTERNS) {
    const m = blob.match(p.re);
    if (m) {
      const money = p.id === "mortgage" ? noMoney : unknownRepair;
      findings.push({
        id: p.id,
        severity: p.severity,
        labelAz: p.labelAz,
        labelRu: p.labelRu,
        ...money,
        evidence: "notes_params",
        evidenceQuote: m[0],
        whyAz: p.whyAz,
        whyRu: p.whyRu,
        nextAz: p.nextAz,
        nextRu: p.nextRu,
        x: p.zone.x,
        y: p.zone.y,
        w: p.zone.w,
        h: p.zone.h,
        label: p.labelRu,
        showOnPhoto: false,
      });
    }
  }

  if (photoCount > 0 && photoCount < 4) {
    const ex = META_EXPLAIN.few_photos;
    findings.push({
      id: "few_photos",
      severity: "med",
      labelAz: `Az foto (${photoCount})`,
      labelRu: `Мало фото (${photoCount})`,
      ...unknownRepair,
      evidence: "photo_meta",
      evidenceQuote: `photos=${photoCount}`,
      whyAz: ex.whyAz,
      whyRu: ex.whyRu,
      nextAz: ex.nextAz,
      nextRu: ex.nextRu,
      ...hashZone(photoCount, 0),
      label: "Мало фото",
      showOnPhoto: false,
    });
  }

  const km = Number(lot.mileageKm || lot.payload?.mileageKm);
  if (Number.isFinite(km) && km > 200000) {
    const ex = META_EXPLAIN.high_mileage;
    findings.push({
      id: "high_mileage",
      severity: "med",
      labelAz: `Yüksək yürüş · ${km.toLocaleString("en-US")} km`,
      labelRu: `Высокий пробег · ${km.toLocaleString("en-US")} км`,
      ...unknownRepair,
      evidence: "params",
      evidenceQuote: `mileageKm=${km}`,
      whyAz: ex.whyAz,
      whyRu: ex.whyRu,
      nextAz: ex.nextAz,
      nextRu: ex.nextRu,
      ...hashZone(km, 1),
      label: "Пробег",
      showOnPhoto: false,
    });
  }

  const condition = String(lot.condition || lot.payload?.condition || "");
  if (/orta|космет|təmirsiz|без ремонт|təmir/i.test(condition)) {
    const ex = META_EXPLAIN.mid_repair;
    findings.push({
      id: "mid_repair",
      severity: "med",
      labelAz: `Vəziyyət: ${condition}`,
      labelRu: `Состояние: ${condition}`,
      ...unknownRepair,
      evidence: "params",
      evidenceQuote: condition,
      whyAz: ex.whyAz,
      whyRu: ex.whyRu,
      nextAz: ex.nextAz,
      nextRu: ex.nextRu,
      ...hashZone(3, 2),
      label: "Ремонт",
      showOnPhoto: false,
    });
  }

  // Честный «пустой» сигнал — чтобы UI не говорил про «скан зон на фото»
  const textHits = findings.filter((f) => f.evidence === "notes_params");
  if (textHits.length === 0) {
    const ex = META_EXPLAIN.no_text_signals;
    findings.push({
      id: "no_text_signals",
      severity: "low",
      labelAz: "Mətndə sübutlu zədə siqnalı yoxdur",
      labelRu: "В тексте нет подтверждённых сигналов по повреждениям",
      ...noMoney,
      evidence: "honesty",
      evidenceQuote: notes ? notes.slice(0, 80) : "notes empty",
      whyAz: ex.whyAz,
      whyRu: ex.whyRu,
      nextAz: ex.nextAz,
      nextRu: ex.nextRu,
      x: 50,
      y: 50,
      w: 0,
      h: 0,
      label: "Осмотр",
      showOnPhoto: false,
    });
  }

  const confidence =
    textHits.length === 0
      ? photoCount >= 6
        ? 58
        : 45
      : Math.min(92, 55 + textHits.length * 8 + Math.min(20, photoCount));

  const FINDING_EN = {
    no_keys: {
      label: "Keys or documents are with the debtor",
      why: "The herrac note says the keys or documents are with the debtor.",
      next: "Confirm access and the keys before you pay the deposit.",
    },
    engine_dead: {
      label: "Engine or unit does not run",
      why: "The lot text says the engine or equipment does not run.",
      next: "A proper price needs a diagnostic.",
    },
    flood: {
      label: "Flood or moisture risk",
      why: "The text mentions water, moisture or flooding.",
      next: "A proper price needs a diagnostic.",
    },
    flat_tires: {
      label: "Flat tyres",
      why: "The note mentions flat tyres.",
      next: "A proper price needs a diagnostic.",
    },
    body_damage: {
      label: "Body / signs of a crash",
      why: "The text mentions an impact, damage or a crash.",
      next: "A proper price needs a diagnostic.",
    },
    rust: {
      label: "Rust / corrosion (from the text)",
      why: "The herrac text mentions rust or corrosion. We do not paint it onto the photo.",
      next: "A proper price needs a diagnostic.",
    },
    not_in_use: {
      label: "Not in use / stood for a long time",
      why: "The text mentions that it is unused or has been standing.",
      next: "A proper price needs a diagnostic.",
    },
    storage_fee: {
      label: "Paid storage / parking",
      why: "The Hərrac text names a storage cost. A daily rate exists only if it is written.",
      next: "Take the amount from the lot text.",
    },
    not_operating: {
      label: "The property is not operating",
      why: "Herrac says the property is not operating.",
      next: "A proper price needs a diagnostic.",
    },
    paint: {
      label: "Paintwork is mentioned",
      why: "The description mentions paintwork.",
      next: "A proper price needs a diagnostic.",
    },
    mortgage: {
      label: "Legal encumbrance",
      why: "The text mentions a mortgage, arrest or encumbrance.",
      next: "A legal check is required.",
    },
    needs_repair: {
      label: "Needs repair",
      why: "The condition or the text points to repair.",
      next: "A proper price needs a diagnostic.",
    },
    few_photos: {
      label: `Few photos (${photoCount})`,
      why: "Few photos — hidden details may be out of frame.",
      next: "Ask for more photos and an on-site look.",
    },
    high_mileage: {
      label: `High mileage · ${Number(km || 0).toLocaleString("en-US")} km`,
      why: "The parameters state a high mileage.",
      next: "A proper price needs a diagnostic.",
    },
    mid_repair: {
      label: `Condition: ${condition}`,
      why: "The condition field mentions repair or cosmetics.",
      next: "A proper price needs a diagnostic.",
    },
    no_text_signals: {
      label: "The text has no confirmed damage signals",
      why: "The herrac text has no signal about damage, keys or the engine. We do not “see” rust or water in the pixels — look on site.",
      next: "Inspect the lot on site.",
    },
  };

  const defects = findings.map((f, i) => ({
    id: f.id,
    n: i + 1,
    label: f.label || f.labelRu,
    labelAz: f.labelAz,
    labelRu: f.labelRu,
    labelEn: FINDING_EN[f.id]?.label || f.labelRu,
    whyEn: FINDING_EN[f.id]?.why || f.whyRu,
    nextEn: FINDING_EN[f.id]?.next || f.nextRu,
    cost: null,
    costOrigin: f.costOrigin || ORIGIN.UNKNOWN,
    costStatus: f.costStatus || "unknown",
    costNoteRu: f.costNoteRu || null,
    costNoteAz: f.costNoteAz || null,
    severity: f.severity,
    evidence: f.evidence,
    evidenceQuote: f.evidenceQuote,
    whyAz: f.whyAz,
    whyRu: f.whyRu,
    nextAz: f.nextAz,
    nextRu: f.nextRu,
    x: f.x,
    y: f.y,
    w: f.w,
    h: f.h,
    showOnPhoto: Boolean(f.showOnPhoto),
  }));

  return {
    engine: "emlak-local-vision-v3",
    engineNoteAz:
      "Lokal analiz: herrac mətni + parametrlər + foto sayı. Piksel üzərində pas/çat uydurmuruq.",
    engineNoteRu:
      "Локальный анализ: текст herrac + параметры + число фото. Ржавчину и трещины по пикселям не выдумываем.",
    photoCount,
    confidence,
    repairEstimate: null,
    repairEstimateOrigin: ORIGIN.UNKNOWN,
    findings: findings.map((f, i) => ({ ...f, n: i + 1 })),
    defects,
    evidenceLabelAz: (ev) => evidenceLabel(ev, "az"),
    evidenceLabelRu: (ev) => evidenceLabel(ev, "ru"),
    summaryAz: textHits.length
      ? `${textHits.length} mətn siqnalı · təmirin dəyəri məlum deyil`
      : "Mətndə kritik siqnal yoxdur — fotoya özünüz baxın, sonra yerində yoxlayın",
    summaryRu: textHits.length
      ? `${textHits.length} сигнал(ов) из текста · стоимость ремонта неизвестна`
      : "В тексте нет критических сигналов — смотрите фото сами, затем осмотр на месте",
  };
}

export { evidenceLabel, NOTE_PATTERNS };
