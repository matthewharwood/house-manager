import type { Progress, Settings } from "@house-manager/schemas";
import { type DBSchema, type IDBPDatabase, openDB } from "idb";

import type { EntityRecord } from "./entity-schema";
import { SEED_PEOPLE, SEED_RECIPES } from "./seed-data";
import {
  type Namespace,
  type Org,
  SEED_NAMESPACES,
  SEED_ORGS,
  SEED_SELECTION,
  type WorkspaceSelection,
} from "./workspace-schema";

export interface AppDB extends DBSchema {
  progress: { key: string; value: Progress };
  settings: { key: string; value: Settings };
  orgs: { key: string; value: Org };
  namespaces: { key: string; value: Namespace };
  workspace: { key: string; value: WorkspaceSelection };
  entities: { key: string; value: EntityRecord };
}

// Namespaced by repo scope + app name (the package.json `name`). IndexedDB is
// keyed by origin, so a bare "web" would collide whenever two house-manager
// apps are served from the same origin (e.g. localhost:5173 across repos/apps).
const DB_NAME = "@house-manager/web";
const DB_VERSION = 9;

let dbPromise: Promise<IDBPDatabase<AppDB>> | undefined;
let closed = false;

export function getDB(): Promise<IDBPDatabase<AppDB>> {
  if (closed) {
    return Promise.reject(new Error("idb: closed; reload pending"));
  }
  if (dbPromise) return dbPromise;
  dbPromise = openDB<AppDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, _newVersion, transaction) {
      // Cumulative migrations — every hop must run for users on older versions.
      // Equivalent to `switch(oldVersion)` with fall-through; the `<` form is
      // biome-clean and just as canonical.
      if (oldVersion < 1) {
        db.createObjectStore("progress", { keyPath: "id" });
      }
      if (oldVersion < 2) {
        const settings = db.createObjectStore("settings", { keyPath: "id" });
        void settings.put({ id: "settings", theme: "light", reducedMotion: false });
      }
      if (oldVersion < 3) {
        // Two-tier workspace (RULES.md §4.0): seed orgs + namespaces + the
        // active selection so a fresh install opens straight into a household.
        const orgs = db.createObjectStore("orgs", { keyPath: "id" });
        for (const org of SEED_ORGS) void orgs.put(org);
        const namespaces = db.createObjectStore("namespaces", { keyPath: "id" });
        for (const ns of SEED_NAMESPACES) void namespaces.put(ns);
        const workspace = db.createObjectStore("workspace", { keyPath: "id" });
        void workspace.put(SEED_SELECTION);
      }
      if (oldVersion < 4) {
        // One per-namespace domain store (id/type/namespaceId + payload). New
        // entity types reuse it — no further migrations needed.
        db.createObjectStore("entities", { keyPath: "id" });
      }
      if (oldVersion < 5) {
        // Starter content — seed recipe(s) into the entities store.
        const entities = transaction.objectStore("entities");
        for (const recipe of SEED_RECIPES) void entities.put(recipe);
      }
      if (oldVersion < 6) {
        // Recipes gained structured, scalable ingredients + a second recipe —
        // re-seed (same ids overwrite the v5 string-ingredient versions).
        const entities = transaction.objectStore("entities");
        for (const recipe of SEED_RECIPES) void entities.put(recipe);
      }
      if (oldVersion < 7) {
        // Dropped the per-recipe "Every 3 days" cadence — batching is the 1–7
        // "Days" counter now. Re-seed to overwrite the v6 versions.
        const entities = transaction.objectStore("entities");
        for (const recipe of SEED_RECIPES) void entities.put(recipe);
      }
      if (oldVersion < 8) {
        // Chia pudding gained a researched "Toppers" section (ground flax, hemp
        // hearts, goji, shredded dark chocolate, granola). Re-seed to overwrite.
        const entities = transaction.objectStore("entities");
        for (const recipe of SEED_RECIPES) void entities.put(recipe);
      }
      if (oldVersion < 9) {
        // People become first-class entities (RULES.md §12), referenced by id.
        // Seed the family + re-seed recipes whose forWho now holds person ids.
        const entities = transaction.objectStore("entities");
        for (const person of SEED_PEOPLE) void entities.put(person);
        for (const recipe of SEED_RECIPES) void entities.put(recipe);
      }
    },
    blocked() {
      console.warn("idb: blocked by an older connection");
    },
    blocking() {
      void getDB().then((db) => db.close());
      dbPromise = undefined;
    },
    terminated() {
      dbPromise = undefined;
    },
  });
  return dbPromise.catch((err) => {
    dbPromise = undefined;
    throw err;
  });
}

// Close the open connection and refuse further `getDB()` calls so
// `clearAllStorage` can `deleteDatabase` without our own handle blocking
// it AND without a pending debounced persist call sneaking a fresh
// connection in mid-clear. Terminal — the page is expected to reload
// immediately after.
export async function closeDB(): Promise<void> {
  closed = true;
  if (!dbPromise) return;
  const promise = dbPromise;
  dbPromise = undefined;
  try {
    const db = await promise;
    db.close();
  } catch {
    // Open never resolved (e.g. VersionError mid-bump). Nothing to close.
  }
}
