"use client";

/**
 * TaskBoard - назначение на человека или на весь действующий отдел
 */

import { useMemo, useState } from "react";
import {
  CheckSquare,
  Plus,
  Trash2,
  MessageSquare,
  Calendar,
  Users,
  User,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useSystem } from "@/context/SystemContext";
import {
  DEPARTMENTS,
  TASK_STATUSES,
  deptLabel,
  statusMeta,
  staffInDepartment,
} from "@/lib/adminDepartments";
import { ROLES } from "@/lib/roles";
import { useAdminI18n } from "@/lib/i18n/useAdminI18n";
import { downloadCsv } from "@/lib/csvExport";
import { personLabel, presenceMeta } from "@/lib/staffProfile";
import UserAvatar from "@/components/terminal/UserAvatar";

const COPY = {
  az: {
    what: "Nə etmək",
    person: "Bir nəfərə",
    deptAll: "Bütün şöbəyə",
    who: "Kimə",
    willGet: "Alacaqlar",
    noStaff: "Şöbədə aktiv əməkdaş yoxdur",
    assignedBy: "Təyin edən",
    assignees: "İcraçılar",
    reassign: "Yenidən təyin et",
    pick: "Tapşırıq seçin",
    empty: "Filtrdə tapşırıq yoxdur",
    allDepts: "Bütün şöbələr",
    allStatus: "Hamısı",
    deleteTask: "Tapşırığı sil",
    create: "Yarat",
    mine: "Mənim",
  },
  ru: {
    what: "Что сделать",
    person: "На человека",
    deptAll: "На весь отдел",
    who: "Кому",
    willGet: "Получат задачу",
    noStaff: "В отделе нет активных сотрудников",
    assignedBy: "Назначил",
    assignees: "Исполнители",
    reassign: "Переназначить",
    pick: "Выберите задачу",
    empty: "Нет задач в фильтре",
    allDepts: "Все отделы",
    allStatus: "Все",
    deleteTask: "Удалить задачу",
    create: "Создать",
    mine: "Мои",
  },
  en: {
    what: "What to do",
    person: "To a person",
    deptAll: "To whole department",
    who: "Assignee",
    willGet: "Will receive",
    noStaff: "No active staff in this department",
    assignedBy: "Assigned by",
    assignees: "Assignees",
    reassign: "Reassign",
    pick: "Select a task",
    empty: "No tasks in filter",
    allDepts: "All departments",
    allStatus: "All",
    deleteTask: "Delete task",
    create: "Create",
    mine: "Mine",
  },
};

export default function TaskBoard() {
  const { profile } = useAuth();
  const { t, locale } = useAdminI18n();
  const c = COPY[locale] || COPY.ru;
  const {
    tasks,
    users,
    upsertTask,
    setTaskStatus,
    addTaskComment,
    deleteTask,
    pushAudit,
  } = useSystem();

  const [filter, setFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [mineOnly, setMineOnly] = useState(false);
  const [view, setView] = useState("list");
  const [activeId, setActiveId] = useState("");
  const [comment, setComment] = useState("");
  const [now] = useState(() => Date.now());
  const [form, setForm] = useState({
    title: "",
    department: "support",
    assignMode: "person",
    assigneeEmail: "",
    deadline: "",
  });

  const staff = useMemo(
    () => users.filter((u) => u.role !== ROLES.INVESTOR && !u.blocked),
    [users]
  );

  const deptMembers = useMemo(
    () => staffInDepartment(users, form.department),
    [users, form.department]
  );

  const personPool = useMemo(() => {
    if (form.assignMode === "department") return deptMembers;
    return deptMembers.length ? deptMembers : staff;
  }, [form.assignMode, deptMembers, staff]);

  const filtered = useMemo(() => {
    const me = profile?.email;
    return tasks.filter((task) => {
      if (filter !== "all" && task.status !== filter) return false;
      if (deptFilter !== "all" && task.department !== deptFilter) return false;
      if (mineOnly && me) {
        const list = task.assignees?.length
          ? task.assignees
          : task.assigneeEmail
            ? [{ email: task.assigneeEmail }]
            : [];
        const hit =
          list.some((a) => a.email === me) ||
          (task.assignMode === "department" &&
            staffInDepartment(users, task.department).some(
              (u) => u.email === me
            ));
        if (!hit) return false;
      }
      return true;
    });
  }, [tasks, filter, deptFilter, mineOnly, profile?.email, users]);

  const active =
    tasks.find((task) => task.id === activeId) || filtered[0] || null;

  const buildAssignees = (mode, department, email) => {
    if (mode === "department") {
      const members = staffInDepartment(users, department);
      return {
        assignMode: "department",
        assigneeEmail: "",
        assigneeName: `${c.deptAll} · ${deptLabel(department, locale)}`,
        assignees: members.map((u) => ({
          email: u.email,
          name: personLabel(u),
          avatarId: u.avatarId || "slate",
        })),
      };
    }
    const person =
      staff.find((u) => u.email === email) ||
      staffInDepartment(users, department)[0] ||
      staff[0];
    return {
      assignMode: "person",
      assigneeEmail: person?.email || "",
      assigneeName: personLabel(person),
      assignees: person
        ? [
            {
              email: person.email,
              name: personLabel(person),
              avatarId: person.avatarId || "slate",
            },
          ]
        : [],
    };
  };

  const create = (e) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    if (form.assignMode === "department" && !deptMembers.length) return;
    const personEmail =
      form.assigneeEmail ||
      (form.assignMode === "person" ? personPool[0]?.email : "");
    if (form.assignMode === "person" && !personEmail) return;

    const id = `task-${Date.now()}`;
    const assign = buildAssignees(
      form.assignMode,
      form.department,
      personEmail
    );
    upsertTask({
      id,
      title: form.title.trim(),
      department: form.department,
      ...assign,
      createdByEmail: profile?.email,
      createdByName: profile?.displayName || profile?.email,
      status: "todo",
      deadline: form.deadline
        ? new Date(form.deadline).getTime()
        : Date.now() + 86400000 * 3,
      comments: [],
    });
    pushAudit(
      profile?.email,
      `Task: ${form.title.trim()} → ${assign.assigneeName}`
    );
    setForm({
      title: "",
      department: "support",
      assignMode: "person",
      assigneeEmail: "",
      deadline: "",
    });
    setActiveId(id);
  };

  const assigneeLine = (task) => {
    if (task.assignMode === "department") {
      const n = task.assignees?.length || 0;
      return `${deptLabel(task.department, locale)} · ${n}`;
    }
    return task.assigneeName || task.assigneeEmail || "-";
  };

  return (
    <div className="mx-auto max-w-6xl space-y-4 pb-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#93c5fd]">
            Admin · tasks
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold text-white">
            <CheckSquare size={22} className="text-[#60a5fa]" />
            {t.tasksTitle}
          </h1>
          <p className="mt-1 text-[13px] text-[#9aa3ad]">{t.tasksHint}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setView("list")}
            className={[
              "rounded-xl px-3 py-2 text-[12px]",
              view === "list" ? "bg-white/10 text-white" : "text-[#9aa3ad]",
            ].join(" ")}
          >
            {t.tasksList}
          </button>
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={[
              "rounded-xl px-3 py-2 text-[12px]",
              view === "kanban" ? "bg-white/10 text-white" : "text-[#9aa3ad]",
            ].join(" ")}
          >
            {t.tasksKanban}
          </button>
          <button
            type="button"
            className="rounded-xl border border-white/10 px-3 py-2 text-[12px] text-[#9aa3ad]"
            onClick={() =>
              downloadCsv(
                "tasks.csv",
                tasks.map((x) => ({
                  id: x.id,
                  title: x.title,
                  status: x.status,
                  mode: x.assignMode || "person",
                  dept: x.department,
                  assignees: (x.assignees || [])
                    .map((a) => a.email)
                    .join("; "),
                  deadline: x.deadline
                    ? new Date(x.deadline).toISOString()
                    : "",
                }))
              )
            }
          >
            {t.exportCsv}
          </button>
        </div>
      </header>

      <form
        onSubmit={create}
        className="space-y-3 rounded-2xl border border-white/10 bg-[#0a0c12] p-4"
      >
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input
            className="eh-term-input sm:col-span-2"
            placeholder={c.what}
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
          />
          <select
            className="eh-term-input"
            value={form.department}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                department: e.target.value,
                assigneeEmail: "",
              }))
            }
          >
            {DEPARTMENTS.map((d) => (
              <option key={d.id} value={d.id}>
                {deptLabel(d.id, locale)}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="eh-term-input"
            value={form.deadline}
            onChange={(e) =>
              setForm((f) => ({ ...f, deadline: e.target.value }))
            }
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, assignMode: "person" }))}
            className={[
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px]",
              form.assignMode === "person"
                ? "bg-sky-500/20 text-sky-100"
                : "border border-white/10 text-[#9aa3ad]",
            ].join(" ")}
          >
            <User size={13} /> {c.person}
          </button>
          <button
            type="button"
            onClick={() =>
              setForm((f) => ({ ...f, assignMode: "department", assigneeEmail: "" }))
            }
            className={[
              "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[12px]",
              form.assignMode === "department"
                ? "bg-violet-500/20 text-violet-100"
                : "border border-white/10 text-[#9aa3ad]",
            ].join(" ")}
          >
            <Users size={13} /> {c.deptAll}
          </button>
        </div>

        {form.assignMode === "person" ? (
          <div className="space-y-2">
            <div className="text-[11px] text-[#64748b]">{c.who}</div>
            <div className="flex flex-wrap gap-2">
              {personPool.map((u) => {
                const on = form.assigneeEmail === u.email;
                const pm = presenceMeta(u.presence || "online", locale);
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() =>
                      setForm((f) => ({ ...f, assigneeEmail: u.email }))
                    }
                    className={[
                      "inline-flex items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-[12px]",
                      on
                        ? "border-sky-400/50 bg-sky-500/15 text-white"
                        : "border-white/10 text-[#9aa3ad] hover:border-white/20",
                    ].join(" ")}
                  >
                    <UserAvatar
                      name={personLabel(u)}
                      avatarId={u.avatarId || "slate"}
                      size="sm"
                      status={pm.color}
                    />
                    <span>
                      <span className="block font-medium text-white">
                        {personLabel(u)}
                      </span>
                      <span className="text-[10px] text-[#64748b]">
                        {u.jobTitle || u.role}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-violet-400/25 bg-violet-500/10 px-3 py-2.5 text-[12px]">
            <div className="font-medium text-violet-50">
              {c.willGet} ({deptMembers.length})
            </div>
            {deptMembers.length ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {deptMembers.map((u) => {
                  const pm = presenceMeta(u.presence || "online", locale);
                  return (
                    <span
                      key={u.id}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 px-2 py-1 text-[11px] text-violet-100"
                    >
                      <UserAvatar
                        name={personLabel(u)}
                        avatarId={u.avatarId || "slate"}
                        size="sm"
                        status={pm.color}
                      />
                      {personLabel(u)}
                    </span>
                  );
                })}
              </div>
            ) : (
              <p className="mt-1 text-violet-200/80">{c.noStaff}</p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={
            form.assignMode === "department" && deptMembers.length === 0
          }
          className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#2563eb] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-40"
        >
          <Plus size={14} /> {c.create}
        </button>
      </form>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={[
            "rounded-xl px-3 py-1.5 text-[12px]",
            filter === "all" ? "bg-white/10 text-white" : "text-[#9aa3ad]",
          ].join(" ")}
        >
          {c.allStatus}
        </button>
        {TASK_STATUSES.map((s) => {
          const sm = statusMeta(s.id, locale);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setFilter(s.id)}
              className={[
                "rounded-xl px-3 py-1.5 text-[12px]",
                filter === s.id ? "bg-white/10 text-white" : "text-[#9aa3ad]",
              ].join(" ")}
            >
              {sm.label}
            </button>
          );
        })}
        <span className="mx-1 h-6 w-px bg-white/10" />
        <select
          className="eh-term-input w-auto py-1.5 text-[12px]"
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
        >
          <option value="all">{c.allDepts}</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.id} value={d.id}>
              {deptLabel(d.id, locale)}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setMineOnly((v) => !v)}
          className={[
            "rounded-xl px-3 py-1.5 text-[12px]",
            mineOnly ? "bg-sky-500/20 text-sky-100" : "text-[#9aa3ad]",
          ].join(" ")}
        >
          {c.mine}
        </button>
      </div>

      {view === "kanban" ? (
        <div className="grid gap-3 md:grid-cols-3">
          {TASK_STATUSES.map((col) => {
            const sm = statusMeta(col.id, locale);
            return (
              <div
                key={col.id}
                className="rounded-2xl border border-white/10 bg-[#0a0c12] p-3"
              >
                <div className={`mb-3 rounded-lg px-2 py-1 text-[12px] ${sm.cls}`}>
                  {sm.label}
                </div>
                <div className="space-y-2">
                  {filtered
                    .filter((x) => x.status === col.id)
                    .map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        onClick={() => setActiveId(task.id)}
                        className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] p-3 text-left"
                      >
                        <div className="text-[13px] text-white">{task.title}</div>
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-[#64748b]">
                          {task.assignMode === "department" ? (
                            <Users size={10} />
                          ) : (
                            <User size={10} />
                          )}
                          {assigneeLine(task)}
                        </div>
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {view === "list" ? (
        <div className="grid gap-3 lg:grid-cols-[1fr_340px]">
          <div className="space-y-2">
            {filtered.map((task) => {
              const st = statusMeta(task.status, locale);
              const overdue =
                task.status !== "done" &&
                task.deadline &&
                task.deadline < now;
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => setActiveId(task.id)}
                  className={[
                    "w-full rounded-2xl border p-4 text-left transition",
                    (active?.id || "") === task.id
                      ? "border-sky-400/40 bg-sky-500/10"
                      : "border-white/10 bg-[#0a0c12] hover:border-white/20",
                  ].join(" ")}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <div className="text-[14px] font-medium text-white">
                        {task.title}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-[#9aa3ad]">
                        <span>{deptLabel(task.department, locale)}</span>
                        <span>·</span>
                        <span className="inline-flex items-center gap-1">
                          {task.assignMode === "department" ? (
                            <Users size={11} className="text-violet-300" />
                          ) : (
                            <User size={11} className="text-sky-300" />
                          )}
                          {assigneeLine(task)}
                        </span>
                      </div>
                      <div className="mt-1 text-[10px] text-[#64748b]">
                        {c.assignedBy}:{" "}
                        {task.createdByName || task.createdByEmail}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] ${st.cls}`}
                      >
                        {st.label}
                      </span>
                      <span
                        className={[
                          "inline-flex items-center gap-1 font-mono text-[10px]",
                          overdue ? "text-rose-300" : "text-[#64748b]",
                        ].join(" ")}
                      >
                        <Calendar size={10} />
                        {task.deadline
                          ? new Date(task.deadline).toLocaleDateString(
                              locale === "az"
                                ? "az-AZ"
                                : locale === "en"
                                  ? "en-GB"
                                  : "ru-RU"
                            )
                          : "-"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
            {!filtered.length ? (
              <p className="rounded-2xl border border-dashed border-white/10 p-8 text-center text-[13px] text-[#64748b]">
                {c.empty}
              </p>
            ) : null}
          </div>

          <aside className="rounded-2xl border border-white/10 bg-[#0a0c12] p-4">
            {!active ? (
              <p className="text-[13px] text-[#64748b]">{c.pick}</p>
            ) : (
              <div className="space-y-3">
                <h2 className="text-[15px] font-semibold text-white">
                  {active.title}
                </h2>
                <p className="text-[12px] text-[#9aa3ad]">
                  {deptLabel(active.department, locale)}
                  <br />
                  {c.assignedBy}:{" "}
                  {active.createdByName || active.createdByEmail}
                </p>

                <div className="rounded-xl border border-white/[0.06] px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-[#64748b]">
                    {active.assignMode === "department" ? (
                      <Users size={12} />
                    ) : (
                      <User size={12} />
                    )}
                    {c.assignees}
                  </div>
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {(active.assignees?.length
                      ? active.assignees
                      : [
                          {
                            email: active.assigneeEmail,
                            name: active.assigneeName,
                          },
                        ]
                    ).map((a) => {
                      const u = users.find((x) => x.email === a.email);
                      const pm = presenceMeta(
                        u?.presence || "online",
                        locale
                      );
                      return (
                        <span
                          key={a.email || a.name}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 px-2 py-1 text-[11px] text-[#e2e8f0]"
                        >
                          <UserAvatar
                            name={a.name || a.email}
                            avatarId={a.avatarId || u?.avatarId || "slate"}
                            size="sm"
                            status={pm.color}
                          />
                          {a.name || a.email}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {TASK_STATUSES.map((s) => {
                    const sm = statusMeta(s.id, locale);
                    return (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setTaskStatus(active.id, s.id)}
                        className={[
                          "rounded-lg px-2.5 py-1 text-[11px]",
                          active.status === s.id
                            ? sm.cls
                            : "text-[#64748b] hover:text-white",
                        ].join(" ")}
                      >
                        {sm.label}
                      </button>
                    );
                  })}
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] text-[#64748b]">{c.reassign}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const assign = buildAssignees(
                          "department",
                          active.department,
                          ""
                        );
                        upsertTask({ ...active, ...assign });
                      }}
                      className="rounded-lg border border-violet-400/30 px-2 py-1 text-[11px] text-violet-100"
                    >
                      {c.deptAll}
                    </button>
                  </div>
                  <select
                    className="eh-term-input text-[12px]"
                    value={active.assigneeEmail || ""}
                    onChange={(e) => {
                      const assign = buildAssignees(
                        "person",
                        active.department,
                        e.target.value
                      );
                      upsertTask({ ...active, ...assign });
                    }}
                  >
                    <option value="">{c.person}</option>
                    {staffInDepartment(users, active.department).map((u) => (
                      <option key={u.id} value={u.email}>
                        {personLabel(u)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="mb-2 flex items-center gap-1.5 text-[12px] text-white">
                    <MessageSquare size={13} />
                    Comments
                  </div>
                  <ul className="max-h-40 space-y-2 overflow-y-auto">
                    {(active.comments || []).map((cm) => (
                      <li
                        key={cm.id}
                        className="rounded-xl border border-white/[0.06] px-2.5 py-2 text-[12px]"
                      >
                        <div className="text-[10px] text-[#64748b]">
                          {cm.name}
                        </div>
                        <p className="mt-0.5 text-[#e8eaed]">{cm.text}</p>
                      </li>
                    ))}
                  </ul>
                  <form
                    className="mt-2 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!comment.trim()) return;
                      addTaskComment(active.id, {
                        from: profile?.email,
                        name: profile?.displayName || profile?.email,
                        text: comment.trim(),
                      });
                      setComment("");
                    }}
                  >
                    <input
                      className="eh-term-input flex-1 text-[12px]"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                    <button
                      type="submit"
                      className="rounded-xl bg-white/10 px-3 text-[12px] text-white"
                    >
                      +
                    </button>
                  </form>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    deleteTask(active.id);
                    setActiveId("");
                    pushAudit(
                      profile?.email,
                      `Task deleted: ${active.title}`,
                      "warn"
                    );
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-400/30 px-3 py-2 text-[12px] text-rose-200"
                >
                  <Trash2 size={13} /> {c.deleteTask}
                </button>
              </div>
            )}
          </aside>
        </div>
      ) : null}

      {view === "kanban" && active ? (
        <div className="rounded-2xl border border-sky-400/30 bg-sky-500/10 p-3 text-[12px] text-sky-100">
          {active.title} · {assigneeLine(active)}
          <div className="mt-2 flex flex-wrap gap-1">
            {TASK_STATUSES.map((s) => {
              const sm = statusMeta(s.id, locale);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setTaskStatus(active.id, s.id)}
                  className="rounded-lg bg-white/10 px-2 py-1 text-[11px]"
                >
                  {sm.label}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
