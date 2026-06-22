import { useAtomValue, useSetAtom } from "jotai";
import { Archive, ArchiveRestore, Pencil, Plus } from "lucide-react";
import { type ReactNode, useState } from "react";

import { SelectField, TextField } from "~/components/ui/field";
import { Modal } from "~/components/ui/modal";

import {
  formatBirthday,
  PERSON_ROLES,
  PERSON_TAG_LABELS,
  PERSON_TAGS,
  type Person,
  people,
  personAge,
} from "./data";

const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-button bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-button border border-hairline px-3 py-1.5 text-xs text-muted transition-colors hover:bg-raised hover:text-fg";
const iconBtn =
  "grid size-8 shrink-0 place-items-center rounded-button text-muted transition-colors hover:bg-raised hover:text-fg";

// People are the household's source of truth — every recipe/chore references
// them by id (RULES.md §12). Archived, never deleted.
export function PeoplePage() {
  const all = useAtomValue(people.listAtom);
  const upsert = useSetAtom(people.upsertAtom);
  // `null` = closed, "new" = add form, Person = edit form.
  const [editing, setEditing] = useState<Person | "new" | null>(null);

  const active = all.filter((person) => !person.archived);
  const archived = all.filter((person) => person.archived);
  const groups = PERSON_TAGS.map((tag) => ({
    tag,
    label: PERSON_TAG_LABELS[tag],
    members: active.filter((person) => person.tags.includes(tag)),
  })).filter((group) => group.members.length > 0);
  const untagged = active.filter((person) => !PERSON_TAGS.some((tag) => person.tags.includes(tag)));

  const toggleArchive = (person: Person) => upsert({ id: person.id, archived: !person.archived });

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl text-fg">People</h1>
          <p className="heading-body text-sm text-muted">
            Everyone in the household. Edit someone once and it updates everywhere they're
            referenced.
          </p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className={primaryBtn}>
          <Plus className="size-4" aria-hidden /> Add person
        </button>
      </header>

      {active.length === 0 ? (
        <p className="rounded-card border border-dashed border-hairline p-6 text-center text-sm text-muted">
          No people yet. Add your first.
        </p>
      ) : null}

      {groups.map((group) => (
        <PersonGroup key={group.tag} label={group.label}>
          {group.members.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onEdit={() => setEditing(person)}
              onToggleArchive={() => toggleArchive(person)}
            />
          ))}
        </PersonGroup>
      ))}

      {untagged.length > 0 ? (
        <PersonGroup label="Other">
          {untagged.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onEdit={() => setEditing(person)}
              onToggleArchive={() => toggleArchive(person)}
            />
          ))}
        </PersonGroup>
      ) : null}

      {archived.length > 0 ? (
        <PersonGroup label="Archived" muted>
          {archived.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              onEdit={() => setEditing(person)}
              onToggleArchive={() => toggleArchive(person)}
            />
          ))}
        </PersonGroup>
      ) : null}

      {editing ? (
        <PersonModal
          key={editing === "new" ? "new" : editing.id}
          person={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
        />
      ) : null}
    </div>
  );
}

function PersonGroup({
  label,
  muted = false,
  children,
}: {
  label: string;
  muted?: boolean;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2
        className={`text-2xs font-medium uppercase tracking-wide ${muted ? "text-faint" : "text-muted"}`}
      >
        {label}
      </h2>
      <ul className="flex flex-col gap-2">{children}</ul>
    </section>
  );
}

function PersonCard({
  person,
  onEdit,
  onToggleArchive,
}: {
  person: Person;
  onEdit: () => void;
  onToggleArchive: () => void;
}) {
  const age = personAge(person.birthday);
  const birthday = formatBirthday(person.birthday);
  const ageSuffix = age !== null ? ` · ${age}` : "";
  const birthdayLabel = birthday ? `${birthday}${ageSuffix}` : "No birthday set";
  const ArchiveIcon = person.archived ? ArchiveRestore : Archive;
  return (
    <li
      className={`flex items-center gap-3 rounded-card border border-hairline bg-surface p-3 ${person.archived ? "opacity-60" : ""}`}
    >
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-md bg-raised text-sm font-medium text-fg"
      >
        {person.name.charAt(0).toUpperCase()}
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <p className="text-sm font-medium text-fg">{person.name}</p>
          {person.role ? <span className="text-xs text-muted">{person.role}</span> : null}
        </div>
        <p className="text-2xs text-faint">{birthdayLabel}</p>
        {person.aliases.length > 0 ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {person.aliases.map((alias) => (
              <span key={alias} className="rounded-pill bg-raised px-2 py-0.5 text-2xs text-muted">
                {alias}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${person.name}`}
          className={iconBtn}
        >
          <Pencil className="size-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={onToggleArchive}
          aria-label={person.archived ? `Restore ${person.name}` : `Archive ${person.name}`}
          className={iconBtn}
        >
          <ArchiveIcon className="size-4" aria-hidden />
        </button>
      </div>
    </li>
  );
}

function PersonModal({ person, onClose }: { person: Person | null; onClose: () => void }) {
  const upsert = useSetAtom(people.upsertAtom);
  const [draft, setDraft] = useState({
    name: person?.name ?? "",
    role: person?.role || "Guest",
    birthday: person?.birthday ?? "",
    aliases: (person?.aliases ?? []).join(", "),
    tags: person?.tags ?? [],
  });
  const set = (key: "name" | "role" | "birthday" | "aliases") => (value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const toggleTag = (tag: string) =>
    setDraft((current) => ({
      ...current,
      tags: current.tags.includes(tag)
        ? current.tags.filter((value) => value !== tag)
        : [...current.tags, tag],
    }));
  const canSave = draft.name.trim().length > 0;
  // Keep a custom role (not in the suggestion list) selectable when editing.
  const roleOptions = (PERSON_ROLES as readonly string[]).includes(draft.role)
    ? PERSON_ROLES
    : [draft.role, ...PERSON_ROLES];

  return (
    <Modal
      open
      onClose={onClose}
      title={person ? "Edit person" : "Add person"}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ghostBtn}>
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            className={`${primaryBtn} disabled:opacity-50`}
            onClick={() => {
              upsert({
                ...(person ? { id: person.id } : {}),
                name: draft.name.trim(),
                role: draft.role,
                birthday: draft.birthday,
                aliases: draft.aliases
                  .split(",")
                  .map((alias) => alias.trim())
                  .filter(Boolean),
                tags: draft.tags,
              });
              onClose();
            }}
          >
            {person ? "Save" : "Add"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <TextField label="Name" value={draft.name} onChange={set("name")} placeholder="Daisy" />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label="Role"
            value={draft.role}
            onChange={set("role")}
            options={roleOptions}
          />
          <TextField
            label="Birthday"
            type="date"
            value={draft.birthday}
            onChange={set("birthday")}
          />
        </div>
        <TextField
          label="Aliases (comma-separated)"
          value={draft.aliases}
          onChange={set("aliases")}
          placeholder="Mama, Mom"
        />
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted">Tags</span>
          <div className="flex flex-wrap gap-2">
            {PERSON_TAGS.map((tag) => {
              const on = draft.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleTag(tag)}
                  className={`rounded-pill border px-3 py-1 text-xs transition-colors ${
                    on
                      ? "border-accent bg-accent/15 text-accent"
                      : "border-hairline text-muted hover:text-fg"
                  }`}
                >
                  {PERSON_TAG_LABELS[tag]}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Modal>
  );
}
