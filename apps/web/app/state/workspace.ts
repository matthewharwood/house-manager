import { atom } from "jotai";

import { atomWithIDB } from "~/lib/atom-with-idb";

import { getHydratedSnapshot } from "./hydration";
import { persistWorkspace } from "./persist";
import {
  type Namespace,
  type Org,
  SEED_NAMESPACES,
  SEED_ORGS,
  SEED_SELECTION,
  WorkspaceSelectionSchema,
} from "./workspace-schema";

// The active org + namespace — IDB-backed, write-through + cross-tab broadcast,
// exactly like settings. Reads come from the hydrated snapshot.
export const workspaceSelectionAtom = atomWithIDB(
  WorkspaceSelectionSchema,
  (snapshot) => snapshot.workspace,
  persistWorkspace,
  SEED_SELECTION,
);

// Orgs/namespaces are read-only at runtime for now (CRUD is deferred — RULES.md
// §13). They never change after hydration, so memoize the array view once the
// snapshot is available; fall back to the seed (never cached) pre-hydration.
let orgsCache: Org[] | null = null;
let namespacesCache: Namespace[] | null = null;

function allOrgs(): Org[] {
  if (orgsCache) return orgsCache;
  const snapshot = getHydratedSnapshot();
  if (!snapshot) return [...SEED_ORGS];
  orgsCache = [...snapshot.orgs.values()];
  return orgsCache;
}

function allNamespaces(): Namespace[] {
  if (namespacesCache) return namespacesCache;
  const snapshot = getHydratedSnapshot();
  if (!snapshot) return [...SEED_NAMESPACES];
  namespacesCache = [...snapshot.namespaces.values()];
  return namespacesCache;
}

export const orgsAtom = atom<Org[]>(() => allOrgs());

/** Namespaces belonging to the currently active org. */
export const namespacesForActiveOrgAtom = atom<Namespace[]>((get) => {
  const { activeOrgId } = get(workspaceSelectionAtom);
  return allNamespaces().filter((ns) => ns.orgId === activeOrgId);
});

// Returns `undefined` only in the impossible "no seed" case; every consumer
// reads it through optional chaining.
export const activeOrgAtom = atom((get) => {
  const { activeOrgId } = get(workspaceSelectionAtom);
  return allOrgs().find((org) => org.id === activeOrgId) ?? allOrgs()[0];
});

export const activeNamespaceAtom = atom((get) => {
  const { activeNamespaceId } = get(workspaceSelectionAtom);
  return allNamespaces().find((ns) => ns.id === activeNamespaceId) ?? allNamespaces()[0];
});

/** Switch the active namespace within the current org. */
export const setActiveNamespaceAtom = atom(null, (_get, set, namespaceId: string) => {
  set(workspaceSelectionAtom, (prev) => ({ ...prev, activeNamespaceId: namespaceId }));
});

/** Switch the active org; reset the active namespace to the org's first. */
export const setActiveOrgAtom = atom(null, (_get, set, orgId: string) => {
  const firstNs = allNamespaces().find((n) => n.orgId === orgId);
  set(workspaceSelectionAtom, (prev) => ({
    ...prev,
    activeOrgId: orgId,
    activeNamespaceId: firstNs?.id ?? prev.activeNamespaceId,
  }));
});
