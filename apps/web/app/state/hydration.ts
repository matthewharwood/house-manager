import {
  type Progress,
  ProgressSchema,
  SETTINGS_DEFAULT,
  type Settings,
  SettingsSchema,
} from "@house-manager/schemas";

import { getDB } from "./db";
import {
  type Namespace,
  NamespaceSchema,
  type Org,
  OrgSchema,
  SEED_NAMESPACES,
  SEED_ORGS,
  SEED_SELECTION,
  type WorkspaceSelection,
  WorkspaceSelectionSchema,
} from "./workspace-schema";

export type HydratedState = {
  progress: ReadonlyMap<string, Progress>;
  settings: Settings;
  orgs: ReadonlyMap<string, Org>;
  namespaces: ReadonlyMap<string, Namespace>;
  workspace: WorkspaceSelection;
};

// Seed maps reused for the SSR / no-IDB defaults, so a prerendered shell shows
// the same names the hydrated client will (no flash on first paint).
const seedOrgs = (): Map<string, Org> => new Map(SEED_ORGS.map((o) => [o.id, o]));
const seedNamespaces = (): Map<string, Namespace> => new Map(SEED_NAMESPACES.map((n) => [n.id, n]));

export type StoreName = keyof HydratedState;

let resolvedSnapshot: HydratedState | null = null;

export function getHydratedSnapshot(): HydratedState | null {
  return resolvedSnapshot;
}

// Started at module-evaluation time. The root <Suspense> boundary calls
// `use(idbHydrationPromise)` once; until it resolves, no atom is read.
// In a prerender / SSR-shell context (no indexedDB), resolves with empty state.
export const idbHydrationPromise: Promise<HydratedState> = (async () => {
  if (typeof indexedDB === "undefined") {
    const empty: HydratedState = {
      progress: new Map(),
      settings: SETTINGS_DEFAULT,
      orgs: seedOrgs(),
      namespaces: seedNamespaces(),
      workspace: SEED_SELECTION,
    };
    resolvedSnapshot = empty;
    return empty;
  }
  const db = await getDB();
  const [rawProgress, rawSettings, rawOrgs, rawNamespaces, rawWorkspace] = await Promise.all([
    db.getAll("progress"),
    db.get("settings", "settings"),
    db.getAll("orgs"),
    db.getAll("namespaces"),
    db.get("workspace", "workspace"),
  ]);
  const progress = new Map<string, Progress>();
  for (const raw of rawProgress) {
    const parsed = ProgressSchema.safeParse(raw);
    if (parsed.success) progress.set(parsed.data.id, parsed.data);
  }
  const settings = SettingsSchema.parse(rawSettings ?? SETTINGS_DEFAULT);

  const orgs = new Map<string, Org>();
  for (const raw of rawOrgs) {
    const parsed = OrgSchema.safeParse(raw);
    if (parsed.success) orgs.set(parsed.data.id, parsed.data);
  }
  if (orgs.size === 0) for (const o of SEED_ORGS) orgs.set(o.id, o);

  const namespaces = new Map<string, Namespace>();
  for (const raw of rawNamespaces) {
    const parsed = NamespaceSchema.safeParse(raw);
    if (parsed.success) namespaces.set(parsed.data.id, parsed.data);
  }
  if (namespaces.size === 0) for (const n of SEED_NAMESPACES) namespaces.set(n.id, n);

  const workspace = WorkspaceSelectionSchema.parse(rawWorkspace ?? SEED_SELECTION);

  const snapshot: HydratedState = { progress, settings, orgs, namespaces, workspace };
  resolvedSnapshot = snapshot;
  return snapshot;
})();
