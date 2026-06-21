import { type Atom, atom, type WritableAtom } from "jotai";
import type * as z from "zod";

import { EntityBaseSchema, type EntityRecord } from "./entity-schema";
import { getHydratedSnapshot } from "./hydration";
import { deleteEntity, persistEntity } from "./persist";
import { workspaceSelectionAtom } from "./workspace";

export type { EntityRecord };
export { EntityBaseSchema };

// Lazy in-memory cache of the `entities` IDB store, seeded from the hydrated
// snapshot on first read (mirrors atomWithIDB). Holds every type/namespace; the
// per-collection atoms below slice it.
const UNINIT: unique symbol = Symbol("entities.uninit");
const storageAtom = atom<Map<string, EntityRecord> | typeof UNINIT>(UNINIT);

function resolve(raw: Map<string, EntityRecord> | typeof UNINIT): Map<string, EntityRecord> {
  if (raw !== UNINIT) return raw;
  const snapshot = getHydratedSnapshot();
  return new Map(snapshot ? snapshot.entities : []);
}

const entitiesAtom = atom(
  (get) => resolve(get(storageAtom)),
  (_get, set, next: Map<string, EntityRecord>) => set(storageAtom, next),
);

function newId(type: string): string {
  const rand =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
  return `${type}_${rand}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export interface Collection<T extends EntityRecord> {
  /** Records of this type in the active namespace, newest first. */
  listAtom: Atom<T[]>;
  /** Create (no id) or update (with id); returns the saved record. */
  upsertAtom: WritableAtom<null, [Partial<T> & { id?: string }], T>;
  /** Remove by id. */
  removeAtom: WritableAtom<null, [string], void>;
}

// Define a per-namespace collection from a schema that extends EntityBaseSchema.
export function defineCollection<T extends EntityRecord>(
  type: string,
  schema: z.ZodType<T>,
): Collection<T> {
  const listAtom = atom((get): T[] => {
    const { activeNamespaceId } = get(workspaceSelectionAtom);
    const out: T[] = [];
    for (const record of get(entitiesAtom).values()) {
      if (record.type !== type || record.namespaceId !== activeNamespaceId) continue;
      const parsed = schema.safeParse(record);
      if (parsed.success) out.push(parsed.data);
    }
    out.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return out;
  });

  const upsertAtom = atom(null, (get, set, input: Partial<T> & { id?: string }): T => {
    const { activeNamespaceId } = get(workspaceSelectionAtom);
    const all = get(entitiesAtom);
    const existing = input.id ? all.get(input.id) : undefined;
    const now = nowIso();
    const record = schema.parse({
      ...existing,
      ...input,
      id: input.id ?? newId(type),
      type,
      namespaceId: existing?.namespaceId ?? activeNamespaceId,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    const next = new Map(all);
    next.set(record.id, record);
    set(entitiesAtom, next);
    persistEntity(record);
    return record;
  });

  const removeAtom = atom(null, (get, set, id: string) => {
    const all = get(entitiesAtom);
    if (!all.has(id)) return;
    const next = new Map(all);
    next.delete(id);
    set(entitiesAtom, next);
    deleteEntity(id);
  });

  return { listAtom, upsertAtom, removeAtom };
}
