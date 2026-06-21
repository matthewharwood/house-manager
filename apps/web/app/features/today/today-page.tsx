import { Link } from "@tanstack/react-router";
import { useAtomValue } from "jotai";
import { Briefcase } from "lucide-react";

import { candidates } from "~/features/hiring/data";
import { type Occurrence, occurrencesOn } from "~/features/tasks/cadence";
import { TASK_AREAS, type TaskArea, tasks } from "~/features/tasks/data";
import { OccurrenceRow } from "~/features/tasks/task-board";
import { formatLongDay, todayIso } from "~/lib/date";

const AREA_LABELS: Record<TaskArea, string> = {
  chores: "Chores",
  meals: "Meals",
  pets: "Pets",
  kids: "Kids",
  appointments: "Appointments",
  other: "Other",
};

// The daily aggregate across every area — the high-frequency landing surface
// (RULES.md §7: Day is the phone default).
export function TodayPage() {
  const allTasks = useAtomValue(tasks.listAtom);
  const allCandidates = useAtomValue(candidates.listAtom);
  const today = todayIso();
  const occurrences = occurrencesOn(allTasks, today);

  const byArea: Partial<Record<TaskArea, Occurrence[]>> = {};
  for (const occurrence of occurrences) {
    const list = byArea[occurrence.task.area] ?? [];
    list.push(occurrence);
    byArea[occurrence.task.area] = list;
  }
  const done = occurrences.filter((occurrence) => occurrence.done).length;
  const activeCandidates = allCandidates.filter((candidate) => !candidate.archived).length;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl text-fg">Today</h1>
        <p className="heading-body text-sm text-muted">{formatLongDay(today)}</p>
      </header>

      {occurrences.length > 0 ? (
        <div className="flex items-center gap-3 rounded-card border border-hairline bg-surface p-4">
          <ProgressRing done={done} total={occurrences.length} />
          <div>
            <p className="text-sm text-fg">
              <span className="nums">{done}</span> of{" "}
              <span className="nums">{occurrences.length}</span> done
            </p>
            <p className="text-xs text-muted">
              {done === occurrences.length ? "All clear — nice." : "Keep the streak going."}
            </p>
          </div>
        </div>
      ) : (
        <p className="rounded-card border border-dashed border-hairline p-6 text-center text-sm text-muted">
          Nothing scheduled today. Add tasks from any area.
        </p>
      )}

      {TASK_AREAS.map((area) => {
        const items = byArea[area];
        if (!items || items.length === 0) return null;
        return (
          <section key={area} className="flex flex-col gap-2">
            <h2 className="text-sm text-muted">{AREA_LABELS[area]}</h2>
            <ul className="flex flex-col gap-2">
              {items.map((occurrence) => (
                <li key={occurrence.task.id}>
                  <OccurrenceRow occurrence={occurrence} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}

      {activeCandidates > 0 ? (
        <Link
          to="/hiring"
          className="flex items-center gap-3 rounded-card border border-hairline bg-surface p-4 transition-colors hover:bg-raised"
        >
          <span className="grid size-9 shrink-0 place-items-center rounded-button bg-raised text-accent">
            <Briefcase className="size-4" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-fg">
              <span className="nums">{activeCandidates}</span> candidate
              {activeCandidates === 1 ? "" : "s"} in the pipeline
            </p>
            <p className="text-xs text-muted">Open Hiring →</p>
          </div>
        </Link>
      ) : null}
    </div>
  );
}

function ProgressRing({ done, total }: { done: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  return (
    <div className="relative grid size-12 shrink-0 place-items-center">
      <svg viewBox="0 0 36 36" className="size-12 -rotate-90" aria-hidden>
        <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-hairline" />
        <circle
          cx="18"
          cy="18"
          r="15.5"
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
          pathLength={100}
          strokeDasharray={`${pct} 100`}
          className="stroke-accent"
        />
      </svg>
      <span className="nums absolute text-[10px] text-fg">{pct}%</span>
    </div>
  );
}
