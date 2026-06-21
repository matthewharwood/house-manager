import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { useState } from "react";

const iconBtn =
  "grid size-8 shrink-0 place-items-center rounded-button text-muted transition-colors hover:bg-raised hover:text-fg";
const smallPrimary =
  "shrink-0 rounded-button bg-accent px-3 py-1.5 text-xs font-medium text-accent-fg transition-opacity hover:opacity-90";
const fieldClass =
  "min-w-0 flex-1 rounded-button border border-hairline bg-surface px-2.5 py-1.5 text-sm text-fg focus:border-accent focus:outline-none";

// Select / create / rename / delete UI for one workspace tier. Shared by the
// namespace switcher's sheet and the Settings modal's organization section.
export function WorkspaceList({
  kind,
  items,
  activeId,
  handlers,
  onSelected,
}: {
  kind: "namespace" | "org";
  items: { id: string; name: string }[];
  activeId: string;
  handlers: {
    select: (id: string) => void;
    create: (name: string) => void;
    rename: (id: string, name: string) => void;
    remove: (id: string) => void;
  };
  onSelected?: () => void;
}) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const canDelete = items.length > 1;
  const noun = kind === "org" ? "organization" : "namespace";

  return (
    <div>
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
                    onSelected?.();
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
    </div>
  );
}
