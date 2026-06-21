import { atom } from "jotai";

// Ephemeral shell UI state (not persisted — resets on reload, by design).
export const sidebarCollapsedAtom = atom(false);
export const drawerOpenAtom = atom(false);
