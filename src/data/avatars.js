/**
 * Preset-аватары профиля (без загрузки файлов — выбор цвета/стиля)
 */

export const AVATAR_PRESETS = [
  { id: "slate", from: "#1e293b", to: "#334155", ring: "#64748b" },
  { id: "ocean", from: "#0c4a6e", to: "#2563eb", ring: "#38bdf8" },
  { id: "forest", from: "#14532d", to: "#059669", ring: "#34d399" },
  { id: "sunset", from: "#7c2d12", to: "#ea580c", ring: "#fdba74" },
  { id: "grape", from: "#4c1d95", to: "#7c3aed", ring: "#c4b5fd" },
  { id: "rose", from: "#881337", to: "#e11d48", ring: "#fda4af" },
  { id: "teal", from: "#134e4a", to: "#0d9488", ring: "#5eead4" },
  { id: "sand", from: "#44403c", to: "#a8a29e", ring: "#d6d3d1" },
];

export function getAvatarPreset(id) {
  return AVATAR_PRESETS.find((a) => a.id === id) || AVATAR_PRESETS[0];
}
