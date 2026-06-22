import * as z from "zod";

import { todayIso } from "~/lib/date";
import { EntityBaseSchema } from "~/state/entity-schema";
import { defineCollection } from "~/state/store";

// People are first-class entities, referenced BY ID everywhere they appear
// (recipe `forWho`, chore rotations, …) so renaming or editing a person updates
// every reference at once. People are ARCHIVED, never deleted (RULES.md §12).

// Tags are a flexible list; these are the seeded buckets. `family` is the
// household; `household-team` is everyone else who helps (sitters, guests, etc.).
export const PERSON_TAGS = ["family", "household-team"] as const;
export type PersonTag = (typeof PERSON_TAGS)[number];

export const PERSON_TAG_LABELS: Record<PersonTag, string> = {
  family: "Family",
  "household-team": "Household team",
};

// `role` is a free string (roles change) — these are just the picker suggestions.
export const PERSON_ROLES = [
  "Mom",
  "Dad",
  "Son",
  "Daughter",
  "Guardian",
  "Helper",
  "Guest",
] as const;

export const PersonSchema = EntityBaseSchema.extend({
  type: z.literal("person"),
  name: z.string().min(1),
  role: z.string().default(""),
  aliases: z.array(z.string()).default([]),
  birthday: z.string().default(""), // ISO "YYYY-MM-DD", or "" if unknown
  tags: z.array(z.string()).default([]),
  archived: z.boolean().default(false),
});
export type Person = z.infer<typeof PersonSchema>;

export const people = defineCollection("person", PersonSchema);

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

// "1984-02-27" -> "Feb 27, 1984" (empty string if not a valid ISO date).
export function formatBirthday(birthday: string): string {
  const parts = birthday.split("-");
  if (parts.length !== 3) return "";
  const year = parts[0];
  const month = MONTHS[Number(parts[1]) - 1];
  const day = Number(parts[2]);
  if (!year || !month || !day) return "";
  return `${month} ${day}, ${year}`;
}

// Whole years between `birthday` and today, or null if no/invalid birthday.
export function personAge(birthday: string): number | null {
  const b = birthday.split("-");
  const t = todayIso().split("-");
  if (b.length !== 3 || t.length !== 3) return null;
  const by = Number(b[0]);
  const bm = Number(b[1]);
  const bd = Number(b[2]);
  const ty = Number(t[0]);
  const tm = Number(t[1]);
  const td = Number(t[2]);
  if (!by || !bm || !bd || !ty || !tm || !td) return null;
  const hadBirthday = tm > bm || (tm === bm && td >= bd);
  const age = ty - by - (hadBirthday ? 0 : 1);
  return age >= 0 ? age : null;
}

// Resolve a list of person ids to display names, falling back to the raw value
// for legacy free-text entries that predate the Person entity.
export function namesFor(ids: readonly string[], byId: Map<string, Person>): string[] {
  return ids.map((id) => byId.get(id)?.name ?? id);
}

export function indexById(list: readonly Person[]): Map<string, Person> {
  return new Map(list.map((person) => [person.id, person]));
}
