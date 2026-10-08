/**
 * Сиды админки — пустые (без фейковых сообщений/задач)
 * Реальные данные позже через API / Postgres
 */

export function seedTeamChannels() {
  return [
    {
      id: "ch-general",
      type: "group",
      name: "Общая группа",
      desc: "Вся команда Emlak Hub",
      members: ["all"],
      messages: [],
    },
  ];
}

export function seedTasks() {
  return [];
}

export function defaultAdminSettings() {
  return {
    maintenanceMode: false,
    allowRegistrations: true,
    supportSlaHours: 24,
    localeDefault: "az",
  };
}
