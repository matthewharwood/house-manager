import { useAtomValue, useSetAtom } from "jotai";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";

import {
  activeNamespaceAtom,
  activeOrgAtom,
  namespacesForActiveOrgAtom,
  orgsAtom,
  setActiveNamespaceAtom,
  setActiveOrgAtom,
} from "~/state/workspace";

import { Sheet, type SheetOption } from "./sheet";

interface WorkspaceSwitcherProps {
  kind: "namespace" | "org";
  variant?: "rail" | "chip";
  collapsed?: boolean;
}

// One control for both tiers (RULES.md §4.0): the NAMESPACE switcher sits at the
// top of the sidebar, the ORG switcher at the bottom. `chip` is the compact
// mobile top-bar form. Either way the picker opens as a modal Sheet (§11.5).
export function WorkspaceSwitcher({
  kind,
  variant = "rail",
  collapsed = false,
}: WorkspaceSwitcherProps) {
  const [open, setOpen] = useState(false);
  const activeNamespace = useAtomValue(activeNamespaceAtom);
  const activeOrg = useAtomValue(activeOrgAtom);
  const namespaces = useAtomValue(namespacesForActiveOrgAtom);
  const orgs = useAtomValue(orgsAtom);
  const setNamespace = useSetAtom(setActiveNamespaceAtom);
  const setOrg = useSetAtom(setActiveOrgAtom);

  const isNamespace = kind === "namespace";
  const active = isNamespace ? activeNamespace : activeOrg;
  const options: SheetOption[] = isNamespace
    ? namespaces.map((ns) => ({ id: ns.id, label: ns.name }))
    : orgs.map((org) => ({ id: org.id, label: org.name }));
  const onSelect = isNamespace ? setNamespace : setOrg;
  const title = isNamespace ? "Switch namespace" : "Switch organization";
  const eyebrow = isNamespace ? "Namespace" : "Organization";
  const initial = active?.name.slice(0, 1).toUpperCase() ?? "?";

  const picker = (
    <Sheet
      open={open}
      onClose={() => setOpen(false)}
      title={title}
      options={options}
      activeId={active?.id ?? ""}
      onSelect={onSelect}
    />
  );

  if (variant === "chip") {
    return (
      <>
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
        {picker}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        title={collapsed ? active?.name : undefined}
        aria-label={`${title} (current: ${active?.name ?? "none"})`}
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
                {eyebrow}
              </span>
              <span className="block truncate text-sm text-fg">{active?.name}</span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted" aria-hidden />
          </>
        )}
      </button>
      {picker}
    </>
  );
}
