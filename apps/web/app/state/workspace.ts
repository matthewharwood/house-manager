import { atom } from "jotai";

import { atomWithIDB } from "~/lib/atom-with-idb";

import { getHydratedSnapshot } from "./hydration";
import {
  deleteNamespaceRow,
  deleteOrgRow,
  persistNamespace,
  persistOrg,
  persistWorkspace,
} from "./persist";
import {
  type Namespace,
  type Org,
  SEED_NAMESPACES,
  SEED_ORGS,
  SEED_SELECTION,
  WorkspaceSelectionSchema,
} from "./workspace-schema";

// The active org + namespace — IDB-backed, write-through + cross-tab broadcast.
export const workspaceSelectionAtom = atomWithIDB(
  WorkspaceSelectionSchema,
  (snapshot) => snapshot.workspace,
  persistWorkspace,
  SEED_SELECTION,
);

function newId(prefix: string): string {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  return `${prefix}-${rand}`;
}

function seedMap<T extends { id: string }>(items: readonly T[]): Map<string, T> {
  return new Map(items.map((item) => [item.id, item]));
}

const UNINIT: unique symbol = Symbol("workspace.uninit");

// Mutable orgs/namespaces maps — lazy-seeded from the hydrated snapshot (like the
// entity store), then mutated by the CRUD actions below and written through.
const orgsStorageAtom = atom<Map<string, Org> | typeof UNINIT>(UNINIT);
const orgsMapAtom = atom(
  (get) => {
    const raw = get(orgsStorageAtom);
    if (raw !== UNINIT) return raw;
    const snapshot = getHydratedSnapshot();
    return snapshot ? new Map(snapshot.orgs) : seedMap(SEED_ORGS);
  },
  (_get, set, next: Map<string, Org>) => set(orgsStorageAtom, next),
);

const namespacesStorageAtom = atom<Map<string, Namespace> | typeof UNINIT>(UNINIT);
const namespacesMapAtom = atom(
  (get) => {
    const raw = get(namespacesStorageAtom);
    if (raw !== UNINIT) return raw;
    const snapshot = getHydratedSnapshot();
    return snapshot ? new Map(snapshot.namespaces) : seedMap(SEED_NAMESPACES);
  },
  (_get, set, next: Map<string, Namespace>) => set(namespacesStorageAtom, next),
);

export const orgsAtom = atom((get) => [...get(orgsMapAtom).values()]);

/** Namespaces belonging to the currently active org. */
export const namespacesForActiveOrgAtom = atom((get) => {
  const { activeOrgId } = get(workspaceSelectionAtom);
  return [...get(namespacesMapAtom).values()].filter(
    (namespace) => namespace.orgId === activeOrgId,
  );
});

// Both return `undefined` only in the impossible "everything deleted" case; every
// consumer reads through optional chaining.
export const activeOrgAtom = atom((get) => {
  const { activeOrgId } = get(workspaceSelectionAtom);
  const orgs = get(orgsMapAtom);
  return orgs.get(activeOrgId) ?? [...orgs.values()][0];
});

export const activeNamespaceAtom = atom((get) => {
  const { activeNamespaceId } = get(workspaceSelectionAtom);
  const namespaces = get(namespacesMapAtom);
  return namespaces.get(activeNamespaceId) ?? [...namespaces.values()][0];
});

/** Switch the active namespace within the current org. */
export const setActiveNamespaceAtom = atom(null, (_get, set, namespaceId: string) => {
  set(workspaceSelectionAtom, (prev) => ({ ...prev, activeNamespaceId: namespaceId }));
});

/** Switch the active org; reset the active namespace to the org's first. */
export const setActiveOrgAtom = atom(null, (get, set, orgId: string) => {
  const firstNamespace = [...get(namespacesMapAtom).values()].find(
    (namespace) => namespace.orgId === orgId,
  );
  set(workspaceSelectionAtom, (prev) => ({
    ...prev,
    activeOrgId: orgId,
    activeNamespaceId: firstNamespace?.id ?? prev.activeNamespaceId,
  }));
});

// --- CRUD (RULES.md §13 open question resolved: seed-only → editable) ---

/** Create a namespace in the active org and switch to it. */
export const createNamespaceAtom = atom(null, (get, set, name: string) => {
  const { activeOrgId } = get(workspaceSelectionAtom);
  const namespace: Namespace = { id: newId("ns"), orgId: activeOrgId, name };
  const next = new Map(get(namespacesMapAtom));
  next.set(namespace.id, namespace);
  set(namespacesMapAtom, next);
  persistNamespace(namespace);
  set(workspaceSelectionAtom, (prev) => ({ ...prev, activeNamespaceId: namespace.id }));
});

export const renameNamespaceAtom = atom(null, (get, set, payload: { id: string; name: string }) => {
  const current = get(namespacesMapAtom).get(payload.id);
  if (!current) return;
  const updated: Namespace = { ...current, name: payload.name };
  const next = new Map(get(namespacesMapAtom));
  next.set(updated.id, updated);
  set(namespacesMapAtom, next);
  persistNamespace(updated);
});

/** Delete a namespace; refuses to remove an org's last one. */
export const deleteNamespaceAtom = atom(null, (get, set, id: string) => {
  const namespaces = get(namespacesMapAtom);
  const target = namespaces.get(id);
  if (!target) return;
  const siblings = [...namespaces.values()].filter((namespace) => namespace.orgId === target.orgId);
  if (siblings.length <= 1) return;
  const next = new Map(namespaces);
  next.delete(id);
  set(namespacesMapAtom, next);
  deleteNamespaceRow(id);
  const { activeNamespaceId } = get(workspaceSelectionAtom);
  if (activeNamespaceId === id) {
    const fallback = siblings.find((namespace) => namespace.id !== id);
    if (fallback) {
      set(workspaceSelectionAtom, (prev) => ({ ...prev, activeNamespaceId: fallback.id }));
    }
  }
});

/** Create an org (plus a default "Home" namespace) and switch to it. */
export const createOrgAtom = atom(null, (get, set, name: string) => {
  const org: Org = { id: newId("org"), name };
  const namespace: Namespace = { id: newId("ns"), orgId: org.id, name: "Home" };
  const nextOrgs = new Map(get(orgsMapAtom));
  nextOrgs.set(org.id, org);
  set(orgsMapAtom, nextOrgs);
  persistOrg(org);
  const nextNamespaces = new Map(get(namespacesMapAtom));
  nextNamespaces.set(namespace.id, namespace);
  set(namespacesMapAtom, nextNamespaces);
  persistNamespace(namespace);
  set(workspaceSelectionAtom, (prev) => ({
    ...prev,
    activeOrgId: org.id,
    activeNamespaceId: namespace.id,
  }));
});

export const renameOrgAtom = atom(null, (get, set, payload: { id: string; name: string }) => {
  const current = get(orgsMapAtom).get(payload.id);
  if (!current) return;
  const updated: Org = { ...current, name: payload.name };
  const next = new Map(get(orgsMapAtom));
  next.set(updated.id, updated);
  set(orgsMapAtom, next);
  persistOrg(updated);
});

/** Delete an org and its namespaces; refuses to remove the last org. */
export const deleteOrgAtom = atom(null, (get, set, id: string) => {
  const orgs = get(orgsMapAtom);
  if (orgs.size <= 1 || !orgs.has(id)) return;
  const nextOrgs = new Map(orgs);
  nextOrgs.delete(id);
  set(orgsMapAtom, nextOrgs);
  deleteOrgRow(id);

  const namespaces = get(namespacesMapAtom);
  const nextNamespaces = new Map(namespaces);
  for (const namespace of namespaces.values()) {
    if (namespace.orgId === id) {
      nextNamespaces.delete(namespace.id);
      deleteNamespaceRow(namespace.id);
    }
  }
  set(namespacesMapAtom, nextNamespaces);

  const { activeOrgId } = get(workspaceSelectionAtom);
  if (activeOrgId === id) {
    const fallbackOrg = [...nextOrgs.values()][0];
    const fallbackNamespace = [...nextNamespaces.values()].find(
      (namespace) => namespace.orgId === fallbackOrg?.id,
    );
    set(workspaceSelectionAtom, (prev) => ({
      ...prev,
      activeOrgId: fallbackOrg?.id ?? prev.activeOrgId,
      activeNamespaceId: fallbackNamespace?.id ?? prev.activeNamespaceId,
    }));
  }
});
