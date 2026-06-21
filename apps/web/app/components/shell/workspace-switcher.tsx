import { useAtomValue, useSetAtom } from "jotai";
import { Check, ChevronsUpDown, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Modal } from "~/components/ui/modal";
import {
  activeNamespaceAtom,
  activeOrgAtom,
  createNamespaceAtom,
  createOrgAtom,
  deleteNamespaceAtom,
  deleteOrgAtom,
  namespacesForActiveOrgAtom,
  orgsAtom,
  renameNamespaceAtom,
  renameOrgAtom,
  setActiveNamespaceAtom,
  setActiveOrgAtom,
} from "~/state/workspace";

interface WorkspaceSwitcherProps {
  kind: "namespace" | "org";
  variant?: "rail" | "chip";
  collapsed?: boolean;
}

interface Item {
  id: string;
  name: string;
}

const iconBtn =
  "grid size-8 shrink-0 place-items-center rounded-button text-muted transition-colors hover:bg-raised hover:text-fg";
const smallPrimary =
  "shrink-0 rounded-button bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90";
const fieldClass =
  "min-w-0 flex-1 rounded-button border border-hairline bg-surface px-2.5 py-1.5 text-sm text-fg focus:border-accent focus:outline-none";

// Drives both tiers (RULES.md §4.0): the NAMESPACE switcher (top of the sidebar)
// and the ORG switcher (bottom). Selecting, creating, renaming, and deleting all
// happen in one thumb-friendly sheet.
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
  const createNamespace = useSetAtom(createNamespaceAtom);
  const createOrg = useSetAtom(createOrgAtom);
  const renameNamespace = useSetAtom(renameNamespaceAtom);
  const renameOrg = useSetAtom(renameOrgAtom);
  const deleteNamespace = useSetAtom(deleteNamespaceAtom);
  const deleteOrg = useSetAtom(deleteOrgAtom);

  const isNamespace = kind === "namespace";
  const active = isNamespace ? activeNamespace : activeOrg;
  const items: Item[] = isNamespace ? namespaces : orgs;
  const eyebrow = isNamespace ? "Namespace" : "Organization";
  const initial = active?.name.slice(0, 1).toUpperCase() ?? "?";

  const handlers = {
    select: (id: string) => (isNamespace ? setNamespace(id) : setOrg(id)),
    create: (name: string) => (isNamespace ? createNamespace(name) : createOrg(name)),
    rename: (id: string, name: string) =>
      isNamespace ? renameNamespace({ id, name }) : renameOrg({ id, name }),
    remove: (id: string) => (isNamespace ? deleteNamespace(id) : deleteOrg(id)),
  };

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
          aria-label={`Manage ${eyebrow.toLowerCase()} (current: ${active?.name ?? "none"})`}
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
      )}
      {open ? (
        <ManageSheet
          kind={kind}
          items={items}
          activeId={active?.id ?? ""}
          onClose={() => setOpen(false)}
          handlers={handlers}
        />
      ) : null}
    </>
  );
}

interface Handlers {
  select: (id: string) => void;
  create: (name: string) => void;
  rename: (id: string, name: string) => void;
  remove: (id: string) => void;
}

function ManageSheet({
  kind,
  items,
  activeId,
  onClose,
  handlers,
}: {
  kind: "namespace" | "org";
  items: Item[];
  activeId: string;
  onClose: () => void;
  handlers: Handlers;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const canDelete = items.length > 1;
  const noun = kind === "org" ? "organization" : "namespace";

  return (
    <Modal open onClose={onClose} title={kind === "org" ? "Organizations" : "Namespaces"}>
      <ul className="flex flex-col gap-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-1">
            {renamingId === item.id ? (
              <>
                <input
                  // biome-ignore lint/a11y/noAutofocus: focus the rename field the moment it appears
                  autoFocus
                  aria-label="New name"
                  className={fieldClass}
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                />
                <button
                  type="button"
                  className={smallPrimary}
                  onClick={() => {
                    const trimmed = draft.trim();
                    if (trimmed) handlers.rename(item.id, trimmed);
                    setRenamingId(null);
                  }}
                >
                  Save
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    handlers.select(item.id);
                    onClose();
                  }}
                  className={`flex min-w-0 flex-1 items-center gap-2 rounded-button px-2.5 py-2 text-left text-sm ${
                    item.id === activeId
                      ? "bg-raised text-fg"
                      : "text-muted hover:bg-raised hover:text-fg"
                  }`}
                >
                  <span className="min-w-0 flex-1 truncate">{item.name}</span>
                  {item.id === activeId ? (
                    <Check className="size-4 shrink-0 text-accent" aria-hidden />
                  ) : null}
                </button>
                <button
                  type="button"
                  aria-label={`Rename ${item.name}`}
                  className={iconBtn}
                  onClick={() => {
                    setRenamingId(item.id);
                    setDraft(item.name);
                  }}
                >
                  <Pencil className="size-3.5" aria-hidden />
                </button>
                <button
                  type="button"
                  aria-label={`Delete ${item.name}`}
                  disabled={!canDelete}
                  className={`${iconBtn} disabled:opacity-30`}
                  onClick={() => handlers.remove(item.id)}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </>
            )}
          </li>
        ))}
      </ul>

      <div className="mt-2 border-t border-hairline pt-2">
        {adding ? (
          <div className="flex items-center gap-1">
            <input
              // biome-ignore lint/a11y/noAutofocus: focus the new-name field the moment it appears
              autoFocus
              aria-label={`New ${noun} name`}
              placeholder={kind === "org" ? "Household name" : "House name"}
              className={fieldClass}
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
            />
            <button
              type="button"
              className={smallPrimary}
              onClick={() => {
                const trimmed = newName.trim();
                if (trimmed) {
                  handlers.create(trimmed);
                  setNewName("");
                  setAdding(false);
                }
              }}
            >
              Add
            </button>
            <button
              type="button"
              aria-label="Cancel"
              className={iconBtn}
              onClick={() => {
                setAdding(false);
                setNewName("");
              }}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-full items-center gap-2 rounded-button px-2.5 py-2 text-sm text-accent transition-colors hover:bg-raised"
          >
            <Plus className="size-4" aria-hidden /> New {noun}
          </button>
        )}
      </div>
    </Modal>
  );
}
