/**
 * Складывает ответы человека в два поля Investment Engine: repair и other.
 * Пустой или «не знаю» остаётся пустой строкой. Ноль — только явный ответ.
 * Сумма чужих расходов не считается, пока хотя бы одна строка неизвестна.
 */

export function emptyAnswers() {
  return {
    repairChoice: "unknown",
    repairAmount: "",
    reserveChoice: "unknown",
    reserveAmount: "",
    extraChoice: "unknown",
    extraAmount: "",
    paperworkChoice: "unknown",
    paperworkAmount: "",
    commissionChoice: "unknown",
    commissionAmount: "",
    prepChoice: "unknown",
    prepAmount: "",
    desiredChoice: "unknown",
    desiredAmount: "",
    desiredPct: "",
    sellOn: true,
    sellPct: "3",
    sellTouched: false,
    bidText: "",
    bidTouched: false,
    saleScenario: "market",
    saleBasis: "market",
    userSaleAmount: "",
  };
}

export function foldUserSale(answers) {
  return String(answers?.userSaleAmount ?? "").trim();
}

export function questionSet(market) {
  if (market === "land") return "land";
  if (market === "estate") return "estate";
  if (market === "auto" || market === "equipment") return "auto";
  return "generic";
}

function piece(choice, amount) {
  if (choice === "none" || choice === "zero") return { known: true, value: 0 };
  if (choice === "1000" || choice === "2000") {
    return { known: true, value: Number(choice) };
  }
  if (choice === "amount") {
    const raw = String(amount ?? "").trim().replace(",", ".");
    if (!raw) return { known: false, value: null };
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) return { known: false, invalid: true, raw };
    return { known: true, value: n };
  }
  return { known: false, value: null };
}

function joinPieces(parts) {
  const invalid = parts.find((part) => part.invalid);
  if (invalid) return invalid.raw;
  if (parts.some((part) => !part.known)) return "";
  return String(parts.reduce((sum, part) => sum + part.value, 0));
}

export function foldCosts(market, answers) {
  const set = questionSet(market);
  const repairPiece =
    set === "land"
      ? piece(answers.prepChoice, answers.prepAmount)
      : piece(answers.repairChoice, answers.repairAmount);

  const otherPieces =
    set === "land"
      ? [
          piece(answers.paperworkChoice, answers.paperworkAmount),
          piece(answers.extraChoice, answers.extraAmount),
        ]
      : set === "estate"
        ? [
            piece(answers.paperworkChoice, answers.paperworkAmount),
            piece(answers.commissionChoice, answers.commissionAmount),
            piece(answers.extraChoice, answers.extraAmount),
          ]
        : set === "auto"
          ? [
              piece(answers.reserveChoice, answers.reserveAmount),
              piece(answers.extraChoice, answers.extraAmount),
            ]
          : [piece(answers.extraChoice, answers.extraAmount)];

  let desiredMode = "amount";
  let desired = "";
  if (answers.desiredChoice === "3000") {
    desired = "3000";
  } else if (answers.desiredChoice === "pct20") {
    desiredMode = "pct";
    desired = "20";
  } else if (answers.desiredChoice === "amount") {
    desired = answers.desiredAmount;
  } else if (answers.desiredChoice === "pct") {
    desiredMode = "pct";
    desired = answers.desiredPct;
  }

  return {
    repair: repairPiece.invalid ? repairPiece.raw : repairPiece.known ? String(repairPiece.value) : "",
    other: joinPieces(otherPieces),
    desiredMode,
    desired,
  };
}
