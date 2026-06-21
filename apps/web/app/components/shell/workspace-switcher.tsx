import { useAtomValue, useSetAtom } from "jotai";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import { Modal } from "~/components/ui/modal";
import {
  activeNamespaceAtom,
  createNamespaceAtom,
  deleteNamespaceAtom,
  namespacesForActiveOrgAtom,
  renameNamespaceAtom,
  setActiveNamespaceAtom,
} from "~/state/workspace";

import { WorkspaceList } from "./workspace-list";

// The NAMESPACE switcher — the top-left selector (RULES.md §4.0). The active
// namespace (a "house" within the current org) is switched here; org selection
// lives in Settings (low frequency). `chip` is the compact mobile top-bar form.
export function WorkspaceSwitcher({
  variant = "rail",
  collapsed = false,
}: {
  variant?: "rail" | "chip";
  collapsed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const active = useAtomValue(activeNamespaceAtom);
  const namespaces = useAtomValue(namespacesForActiveOrgAtom);
  const setNamespace = useSetAtom(setActiveNamespaceAtom);
  const createNamespace = useSetAtom(createNamespaceAtom);
  const renameNamespace = useSetAtom(renameNamespaceAtom);
  const deleteNamespace = useSetAtom(deleteNamespaceAtom);
  const initial = active?.name.slice(0, 1).toUpperCase() ?? "?";

  return (
    <>
      {variant === "chip" ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex min-w-0 items-center gap-1.5 rounded-pill bg-raised px-2.5 py-1.5 text-sm text-fg"
        >
          <span
            aria-hidden
            className="grid size-5 shrink-0 place-items-center rounded-[6px] bg-accent font-display text-[10px] text-accent-fg"
          >
            {initial}
          </span>
          <span className="min-w-0 truncate">{active?.name}</span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-muted" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title={collapsed ? active?.name : undefined}
          aria-label={`Switch house (current: ${active?.name ?? "none"})`}
          className={`flex w-full items-center gap-2.5 rounded-button border border-hairline bg-raised/50 text-left transition-colors hover:bg-raised ${
            collapsed ? "justify-center p-2" : "px-2.5 py-2"
          }`}
        >
          <span
            aria-hidden
            className="grid size-8 shrink-0 place-items-center rounded-[8px] bg-accent font-display text-xs text-accent-fg"
          >
            {initial}
          </span>
          {collapsed ? null : (
            <>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-medium uppercase tracking-wide text-faint">
                  Namespace
                </span>
                <span className="block truncate text-sm text-fg">{active?.name}</span>
              </span>
              <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden />
            </>
          )}
        </button>
      )}
      {open ? (
        <Modal open onClose={() => setOpen(false)} title="Namespaces">
          <WorkspaceList
            kind="namespace"
            items={namespaces}
            activeId={active?.id ?? ""}
            handlers={{
              select: setNamespace,
              create: createNamespace,
              rename: (id, name) => renameNamespace({ id, name }),
              remove: deleteNamespace,
            }}
            onSelected={() => setOpen(false)}
          />
        </Modal>
      ) : null}
    </>
  );
}
