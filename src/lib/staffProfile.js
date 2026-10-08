/**
 * Профиль сотрудника: ФИО, статус, аватар
 */

export const PRESENCE = [
  {
    id: "online",
    label: { az: "Onlayn", ru: "На месте", en: "Online" },
    color: "#34d399",
  },
  {
    id: "away",
    label: { az: "Uzaqda", ru: "Отошёл", en: "Away" },
    color: "#fbbf24",
  },
  {
    id: "busy",
    label: { az: "Məşğul", ru: "Занят", en: "Busy" },
    color: "#fb7185",
  },
  {
    id: "offline",
    label: { az: "Offline", ru: "Не в сети", en: "Offline" },
    color: "#64748b",
  },
];

export function presenceMeta(id, locale = "ru") {
  const p = PRESENCE.find((x) => x.id === id) || PRESENCE[0];
  const L = p.label;
  return {
    ...p,
    label: typeof L === "string" ? L : L[locale] || L.ru,
  };
}

/** Имя для UI / назначения задач */
export function personLabel(u) {
  if (!u) return "";
  const full = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
  if (full) return full;
  return u.displayName || u.name || u.email || "";
}

export function personInitials(u) {
  const label = personLabel(u) || "?";
  const parts = label.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return label.slice(0, 2).toUpperCase();
}

export function composeDisplayName(firstName, lastName, fallback = "") {
  const full = [firstName, lastName].filter(Boolean).join(" ").trim();
  return full || fallback;
}

export function splitDisplayName(displayName = "") {
  const parts = String(displayName).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return { firstName: "", lastName: "" };
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  };
}
