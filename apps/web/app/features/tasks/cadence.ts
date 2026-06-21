import { weekdayOf } from "~/lib/date";

import type { Task } from "./data";

// A single materialized instance of a task on a given date.
export interface Occurrence {
  task: Task;
  date: string;
  done: boolean;
  assignee: string | null;
}

export function occursOn(task: Task, iso: string): boolean {
  if (task.cadence === "once") return task.dueDate === iso;
  if (task.cadence === "daily") return true;
  if (task.cadence === "weekly") return task.weekday === weekdayOf(iso);
  return false;
}

function startDate(task: Task): string {
  return task.createdAt.slice(0, 10);
}

function daysBetween(fromIso: string, toIsoDate: string): number {
  const from = Date.parse(`${fromIso}T00:00:00`);
  const to = Date.parse(`${toIsoDate}T00:00:00`);
  return Math.round((to - from) / 86_400_000);
}

// How many times this task has occurred from its start through `iso` — the
// rotation cursor. Daily rotates per day, weekly per week, once never rotates.
function occurrenceIndex(task: Task, iso: string): number {
  const delta = Math.max(0, daysBetween(startDate(task), iso));
  if (task.cadence === "weekly") return Math.floor(delta / 7);
  if (task.cadence === "daily") return delta;
  return 0;
}

export function assigneeFor(task: Task, iso: string): string | null {
  if (task.rotation.length === 0) return null;
  return task.rotation[occurrenceIndex(task, iso) % task.rotation.length] ?? null;
}

export function occurrenceFor(task: Task, iso: string): Occurrence {
  return {
    task,
    date: iso,
    done: task.completions[iso] === true,
    assignee: assigneeFor(task, iso),
  };
}

export function occurrencesOn(taskList: Task[], iso: string): Occurrence[] {
  return taskList.filter((task) => occursOn(task, iso)).map((task) => occurrenceFor(task, iso));
}

export function countOn(taskList: Task[], iso: string): number {
  return taskList.reduce((total, task) => (occursOn(task, iso) ? total + 1 : total), 0);
}
