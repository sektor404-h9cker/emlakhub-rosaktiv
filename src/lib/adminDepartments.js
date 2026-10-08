/**
 * Отделы и статусы задач админки
 */

export const DEPARTMENTS = [
  { id: "support", label: { az: "Dəstək", ru: "Поддержка", en: "Support" } },
  {
    id: "security",
    label: { az: "Təhlükəsizlik", ru: "Безопасность", en: "Security" },
  },
  { id: "finance", label: { az: "Maliyyə", ru: "Финансы", en: "Finance" } },
  { id: "product", label: { az: "Məhsul", ru: "Продукт", en: "Product" } },
  { id: "ops", label: { az: "Əməliyyatlar", ru: "Операции", en: "Operations" } },
];

/** Какие роли считаются «действующими» в отделе */
export const DEPT_ROLES = {
  support: ["support", "admin"],
  security: ["soc", "admin", "developer"],
  finance: ["admin"],
  product: ["developer", "admin"],
  ops: ["developer", "admin", "support"],
};

export const TASK_STATUSES = [
  {
    id: "todo",
    label: { az: "Edilməyib", ru: "Не выполнено", en: "To do" },
    cls: "text-rose-300 bg-rose-500/15",
  },
  {
    id: "waiting",
    label: { az: "Gözləmə", ru: "Ожидание", en: "Waiting" },
    cls: "text-amber-300 bg-amber-500/15",
  },
  {
    id: "done",
    label: { az: "Hazır", ru: "Готово", en: "Done" },
    cls: "text-emerald-300 bg-emerald-500/15",
  },
];

export function deptLabel(id, locale = "ru") {
  const d = DEPARTMENTS.find((x) => x.id === id);
  if (!d) return id;
  const L = d.label;
  if (typeof L === "string") return L;
  return L[locale] || L.ru || id;
}

export function statusMeta(id, locale = "ru") {
  const s = TASK_STATUSES.find((x) => x.id === id) || TASK_STATUSES[0];
  const L = s.label;
  return {
    ...s,
    label: typeof L === "string" ? L : L[locale] || L.ru,
  };
}

/** Активные сотрудники отдела (не investor, не blocked) */
export function staffInDepartment(users, departmentId) {
  const roles = DEPT_ROLES[departmentId] || [];
  return (users || []).filter(
    (u) =>
      !u.blocked &&
      u.role !== "investor" &&
      roles.includes(u.role)
  );
}

/** @deprecated plain map - use deptLabel */
export const DEPT_LABEL = Object.fromEntries(
  DEPARTMENTS.map((d) => [
    d.id,
    typeof d.label === "string" ? d.label : d.label.ru,
  ])
);
