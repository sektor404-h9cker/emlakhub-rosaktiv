/** Pick a string for az / ru / en. */
export function say(locale, az, ru, en) {
  if (locale === "az") return az;
  if (locale === "en") return en;
  return ru;
}

/** Read az / ru / en off a bilingual or trilingual row. */
export function line(locale, row) {
  if (row == null) return "";
  if (typeof row === "string") return row;
  if (locale === "az") return row.az ?? row.labelAz ?? "";
  if (locale === "en") return row.en ?? row.labelEn ?? row.reasonEn ?? row.ru ?? row.labelRu ?? "";
  return row.ru ?? row.labelRu ?? row.reasonRu ?? "";
}
