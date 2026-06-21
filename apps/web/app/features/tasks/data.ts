import * as z from "zod";

import { EntityBaseSchema } from "~/state/entity-schema";
import { defineCollection } from "~/state/store";

// One task model serves every household area (RULES.md §6–§7). `area` tags which
// surface owns it; `cadence` + `weekday`/`dueDate` drive the day/week/month
// projection (see cadence.ts); `rotation` cycles whose turn it is; `completions`
// records check-offs keyed by ISO date.
export const TASK_AREAS = ["chores", "meals", "pets", "kids", "appointments", "other"] as const;
export type TaskArea = (typeof TASK_AREAS)[number];

export const TASK_CADENCES = ["once", "daily", "weekly"] as const;

export const TaskSchema = EntityBaseSchema.extend({
  type: z.literal("task"),
  title: z.string().min(1),
  area: z.enum(TASK_AREAS).default("other"),
  cadence: z.enum(TASK_CADENCES).default("daily"),
  weekday: z.number().int().min(0).max(6).default(1),
  dueDate: z.string().default(""),
  rotation: z.array(z.string()).default([]),
  completions: z.record(z.string(), z.boolean()).default({}),
});
export type Task = z.infer<typeof TaskSchema>;

export const tasks = defineCollection("task", TaskSchema);
