import * as z from "zod";

// Two-tier tenant model (RULES.md §4.0): an Org owns many Namespaces.
// Leaf module — imported by db / hydration / persist / workspace atoms, so it
// must not import any of them back (keeps the dependency graph acyclic).

export const OrgSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
});
export type Org = z.infer<typeof OrgSchema>;

export const NamespaceSchema = z.object({
  id: z.string().min(1),
  orgId: z.string().min(1),
  name: z.string().min(1),
});
export type Namespace = z.infer<typeof NamespaceSchema>;

// The active workspace selection — a singleton row keyed by the literal id.
export const WorkspaceSelectionSchema = z.object({
  id: z.literal("workspace").default("workspace"),
  activeOrgId: z.string().min(1),
  activeNamespaceId: z.string().min(1),
});
export type WorkspaceSelection = z.infer<typeof WorkspaceSelectionSchema>;

// Single source of truth for the v3 IDB seed AND the SSR/no-IDB defaults, so a
// prerendered shell and the hydrated client render the same names (no flash).
// §2.5: one implicit operator, but the data is already multi-tenant (§2.4) —
// two orgs, one with multiple namespaces, to exercise both switchers.
export const SEED_ORGS: readonly Org[] = [
  { id: "org-home", name: "My Household" },
  { id: "org-parents", name: "Parents' Place" },
];

export const SEED_NAMESPACES: readonly Namespace[] = [
  { id: "ns-main", orgId: "org-home", name: "Main House" },
  { id: "ns-lake", orgId: "org-home", name: "Lake House" },
  { id: "ns-parents", orgId: "org-parents", name: "Mom & Dad" },
];

export const SEED_SELECTION: WorkspaceSelection = {
  id: "workspace",
  activeOrgId: "org-home",
  activeNamespaceId: "ns-main",
};
