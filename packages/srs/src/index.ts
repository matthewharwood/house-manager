// @house-manager/srs — the pure, shareable core (depends only on zod).
//
// Persistence and React bindings live in the subpath entries so this core stays
// portable to any future usage (a CLI, a worker, a different framework):
//   import { ... } from "@house-manager/srs"        // algorithm + schemas + deck ops
//   import { createDeckStore } from "@house-manager/srs/idb"    // IndexedDB persistence
//   import { createDeckAtoms } from "@house-manager/srs/jotai"  // reactive Jotai atoms

export * from "./deck";
export * from "./scheduler";
export * from "./schema";
