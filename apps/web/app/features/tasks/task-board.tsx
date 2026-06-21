import { useAtomValue, useSetAtom } from "jotai";
import { Check, ChevronLeft, ChevronRight, Plus, Repeat } from "lucide-react";
import { type ReactNode, useMemo, useState } from "react";

import { SelectField, TextField } from "~/components/ui/field";
import { Modal } from "~/components/ui/modal";
import { Segmented } from "~/components/ui/segmented";
import {
  addDays,
  addMonths,
  daysInMonth,
  formatDayLabel,
  formatLongDay,
  formatMonthTitle,
  parseIso,
  startOfMonth,
  startOfWeek,
  todayIso,
  WEEKDAY_INITIALS,
  WEEKDAY_NAMES,
  weekdayOf,
} from "~/lib/date";

import { countOn, type Occurrence, occurrencesOn } from "./cadence";
import { TASK_CADENCES, type Task, type TaskArea, tasks } from "./data";

const VIEWS = [
  { id: "day", label: "Day" },
  { id: "week", label: "Week" },
  { id: "month", label: "Month" },
] as const;
type View = (typeof VIEWS)[number]["id"];

const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-button bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-button border border-hairline px-3 py-1.5 text-xs text-muted transition-colors hover:bg-raised hover:text-fg";
const iconBtn =
  "grid size-8 place-items-center rounded-button text-muted transition-colors hover:bg-raised hover:text-fg";

// The shared per-area cadence surface. Chores/Pets/Kids/Meals/Appointments each
// render one with their `area`; Today (separate) aggregates across areas.
export function TaskBoard({
  area,
  title,
  blurb,
}: {
  area: TaskArea;
  title: string;
  blurb?: string;
}) {
  const allTasks = useAtomValue(tasks.listAtom);
  const areaTasks = useMemo(() => allTasks.filter((task) => task.area === area), [allTasks, area]);
  const [view, setView] = useState<View>("day");
  const [anchor, setAnchor] = useState(todayIso);
  const [adding, setAdding] = useState(false);

  const step = (direction: number) => {
    setAnchor((current) => {
      if (view === "day") return addDays(current, direction);
      if (view === "week") return addDays(current, direction * 7);
      return addMonths(current, direction);
    });
  };

  let periodTitle = formatLongDay(anchor);
  if (view === "week") {
    const weekStart = startOfWeek(anchor);
    periodTitle = `${formatDayLabel(weekStart)} – ${formatDayLabel(addDays(weekStart, 6))}`;
  } else if (view === "month") {
    periodTitle = formatMonthTitle(anchor);
  }

  const pickDay = (iso: string) => {
    setAnchor(iso);
    setView("day");
  };

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl text-fg">{title}</h1>
        {blurb ? <p className="heading-body text-sm text-muted">{blurb}</p> : null}
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented value={view} onChange={setView} options={VIEWS} />
        <button type="button" onClick={() => setAdding(true)} className={primaryBtn}>
          <Plus className="size-4" aria-hidden /> Add
        </button>
      </div>

      <div className="flex items-center justify-between gap-2">
        <button type="button" aria-label="Previous" className={iconBtn} onClick={() => step(-1)}>
          <ChevronLeft className="size-4" aria-hidden />
        </button>
        <span className="text-sm font-medium text-fg">{periodTitle}</span>
        <button type="button" aria-label="Next" className={iconBtn} onClick={() => step(1)}>
          <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {view === "day" ? <DayView taskList={areaTasks} date={anchor} /> : null}
      {view === "week" ? <WeekView taskList={areaTasks} anchor={anchor} onPick={pickDay} /> : null}
      {view === "month" ? (
        <MonthView taskList={areaTasks} anchor={anchor} onPick={pickDay} />
      ) : null}

      {adding ? <TaskModal area={area} onClose={() => setAdding(false)} /> : null}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return (
    <p className="rounded-card border border-dashed border-hairline p-6 text-center text-sm text-muted">
      {children}
    </p>
  );
}

function DayView({ taskList, date }: { taskList: Task[]; date: string }) {
  const occurrences = occurrencesOn(taskList, date);
  if (occurrences.length === 0) return <Empty>Nothing scheduled.</Empty>;
  return (
    <ul className="flex flex-col gap-2">
      {occurrences.map((occurrence) => (
        <li key={occurrence.task.id}>
          <OccurrenceRow occurrence={occurrence} />
        </li>
      ))}
    </ul>
  );
}

export function OccurrenceRow({ occurrence }: { occurrence: Occurrence }) {
  const upsert = useSetAtom(tasks.upsertAtom);
  const toggle = () =>
    upsert({
      id: occurrence.task.id,
      completions: { ...occurrence.task.completions, [occurrence.date]: !occurrence.done },
    });

  return (
    <div className="flex items-center gap-3 rounded-card border border-hairline bg-surface p-3">
      <button
        type="button"
        role="checkbox"
        aria-checked={occurrence.done}
        aria-label={occurrence.done ? "Mark not done" : "Mark done"}
        onClick={toggle}
        className={`grid size-6 shrink-0 place-items-center rounded-[7px] border-2 transition-colors ${
          occurrence.done
            ? "border-accent bg-accent text-accent-fg"
            : "border-hairline text-transparent hover:border-accent"
        }`}
      >
        <Check className="size-4" aria-hidden />
      </button>
      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-sm ${occurrence.done ? "text-faint line-through" : "text-fg"}`}
        >
          {occurrence.task.title}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span className="capitalize">{occurrence.task.cadence}</span>
          {occurrence.assignee ? (
            <span className="inline-flex items-center gap-1 rounded-pill bg-raised px-2 py-0.5">
              <Repeat className="size-3" aria-hidden />
              {occurrence.assignee}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function WeekView({
  taskList,
  anchor,
  onPick,
}: {
  taskList: Task[];
  anchor: string;
  onPick: (iso: string) => void;
}) {
  const start = startOfWeek(anchor);
  const days = Array.from({ length: 7 }, (_, index) => addDays(start, index));
  return (
    <div className="flex flex-col gap-2">
      {days.map((day) => {
        const occurrences = occurrencesOn(taskList, day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => onPick(day)}
            className="flex items-start gap-3 rounded-card border border-hairline bg-surface p-3 text-left transition-colors hover:bg-raised"
          >
            <div className="w-12 shrink-0 text-center">
              <div className="text-[10px] uppercase text-faint">
                {(WEEKDAY_NAMES[weekdayOf(day)] ?? "").slice(0, 3)}
              </div>
              <div className="nums text-lg text-fg">{parseIso(day).getDate()}</div>
            </div>
            <div className="min-w-0 flex-1 py-1">
              {occurrences.length === 0 ? (
                <p className="text-xs text-faint">—</p>
              ) : (
                <ul className="flex flex-col gap-1">
                  {occurrences.map((occurrence) => (
                    <li
                      key={occurrence.task.id}
                      className={`truncate text-sm ${
                        occurrence.done ? "text-faint line-through" : "text-fg"
                      }`}
                    >
                      {occurrence.task.title}
                      {occurrence.assignee ? (
                        <span className="text-muted"> · {occurrence.assignee}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function MonthView({
  taskList,
  anchor,
  onPick,
}: {
  taskList: Task[];
  anchor: string;
  onPick: (iso: string) => void;
}) {
  const first = startOfMonth(anchor);
  const total = daysInMonth(anchor);
  const lead = weekdayOf(first);
  const today = todayIso();
  const blanks = Array.from({ length: lead }, (_, index) => `blank-${index}`);
  const days = Array.from({ length: total }, (_, index) => addDays(first, index));

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase text-faint">
        {WEEKDAY_INITIALS.map((initial, index) => (
          <span key={`wd-${index}`}>{initial}</span>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {blanks.map((key) => (
          <span key={key} />
        ))}
        {days.map((day) => {
          const count = countOn(taskList, day);
          const isToday = day === today;
          return (
            <button
              key={day}
              type="button"
              onClick={() => onPick(day)}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-[8px] border text-xs transition-colors hover:bg-raised ${
                isToday ? "border-accent" : "border-hairline"
              }`}
            >
              <span className={`nums ${isToday ? "text-accent" : "text-fg"}`}>
                {parseIso(day).getDate()}
              </span>
              {count > 0 ? <span className="size-1.5 rounded-full bg-accent" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TaskModal({ area, onClose }: { area: TaskArea; onClose: () => void }) {
  const upsert = useSetAtom(tasks.upsertAtom);
  const [draft, setDraft] = useState({
    title: "",
    cadence: "daily",
    weekday: "Monday",
    dueDate: todayIso(),
    rotation: "",
  });
  const set = (key: keyof typeof draft) => (value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const canSave = draft.title.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Add task"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ghostBtn}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            className={`${primaryBtn} disabled:opacity-50`}
            onClick={() => {
              upsert({
                area,
                title: draft.title.trim(),
                cadence: draft.cadence as Task["cadence"],
                weekday: Math.max(
                  0,
                  WEEKDAY_NAMES.findIndex((name) => name === draft.weekday),
                ),
                dueDate: draft.cadence === "once" ? draft.dueDate : "",
                rotation: draft.rotation
                  .split(",")
                  .map((name) => name.trim())
                  .filter(Boolean),
              });
              onClose();
            }}
          >
            Add
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <TextField
          label="Title"
          value={draft.title}
          onChange={set("title")}
          placeholder="Take out recycling"
        />
        <SelectField
          label="Repeats"
          value={draft.cadence}
          onChange={set("cadence")}
          options={TASK_CADENCES}
        />
        {draft.cadence === "weekly" ? (
          <SelectField
            label="On"
            value={draft.weekday}
            onChange={set("weekday")}
            options={WEEKDAY_NAMES}
          />
        ) : null}
        {draft.cadence === "once" ? (
          <TextField label="Date" type="date" value={draft.dueDate} onChange={set("dueDate")} />
        ) : null}
        <TextField
          label="Rotation (comma-separated, optional)"
          value={draft.rotation}
          onChange={set("rotation")}
          placeholder="Alex, Sam"
        />
      </div>
    </Modal>
  );
}
