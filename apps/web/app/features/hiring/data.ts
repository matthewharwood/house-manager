import { atom } from "jotai";
import * as z from "zod";

import { EntityBaseSchema } from "~/state/entity-schema";
import { defineCollection } from "~/state/store";

// Pipeline phases — a slider with a dot per phase, NOT a kanban board
// (RULES.md §8). `phase` is an index into this list; reject/withdraw sets
// `archived` instead of being a phase.
export const HIRING_PHASES = ["New", "Screening", "Interview", "Offer", "Hired"] as const;
export const LAST_PHASE = HIRING_PHASES.length - 1;

// Where the candidate came from — we post to these boards (RULES.md §8.2).
export const CANDIDATE_SOURCES = [
  "LinkedIn",
  "Indeed",
  "ZipRecruiter",
  "Referral",
  "Other",
] as const;

export const POSTING_STATUSES = ["draft", "open", "closed"] as const;

export const CandidateSchema = EntityBaseSchema.extend({
  type: z.literal("candidate"),
  name: z.string().min(1),
  source: z.enum(CANDIDATE_SOURCES).default("Other"),
  email: z.string().default(""),
  phone: z.string().default(""),
  notes: z.string().default(""),
  phase: z.number().int().min(0).max(LAST_PHASE).default(0),
  archived: z.boolean().default(false),
});
export type Candidate = z.infer<typeof CandidateSchema>;

export const JobPostingSchema = EntityBaseSchema.extend({
  type: z.literal("jobPosting"),
  title: z.string().default("House Manager"),
  summary: z.string().default(""),
  responsibilities: z.string().default(""),
  requirements: z.string().default(""),
  location: z.string().default(""),
  schedule: z.string().default(""),
  pay: z.string().default(""),
  status: z.enum(POSTING_STATUSES).default("draft"),
});
export type JobPosting = z.infer<typeof JobPostingSchema>;

export const candidates = defineCollection("candidate", CandidateSchema);
export const jobPostings = defineCollection("jobPosting", JobPostingSchema);

// One posting per namespace in practice — expose the first (most recent).
export const jobPostingAtom = atom((get) => get(jobPostings.listAtom)[0] ?? null);

// Plain-text rendering of a posting, for the "copy to LinkedIn/Indeed/…" action.
export function renderPostingText(posting: JobPosting): string {
  const lines: string[] = [posting.title.toUpperCase(), ""];
  const meta = [
    posting.location && `Location: ${posting.location}`,
    posting.schedule && `Schedule: ${posting.schedule}`,
    posting.pay && `Pay: ${posting.pay}`,
  ].filter(Boolean);
  if (meta.length) lines.push(meta.join("  ·  "), "");
  if (posting.summary) lines.push(posting.summary, "");
  if (posting.responsibilities) lines.push("RESPONSIBILITIES", posting.responsibilities, "");
  if (posting.requirements) lines.push("REQUIREMENTS", posting.requirements, "");
  return lines.join("\n").trim();
}
