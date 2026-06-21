import * as z from "zod";

// Base fields every domain record carries. A single IDB `entities` store holds
// them all; `type` partitions records (candidate, task, …) and `namespaceId`
// scopes them to a namespace (RULES.md §4.0). New entity types need only a Zod
// schema that `.extend()`s this — no new store, no migration.
//
// Leaf module: no imports from db / hydration / persist / store (keeps the
// dependency graph acyclic).
export const EntityBaseSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  namespaceId: z.string().min(1),
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
});

export type EntityRecord = z.infer<typeof EntityBaseSchema>;
