import { useAtomValue, useSetAtom } from "jotai";
import { ChevronDown, Plus } from "lucide-react";
import { useState } from "react";

import { SelectField, TextArea, TextField } from "~/components/ui/field";
import { Modal } from "~/components/ui/modal";

import { MEAL_TYPE_LABELS, MEAL_TYPES, type Recipe, recipes } from "./data";

const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-button bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-button border border-hairline px-3 py-1.5 text-xs text-muted transition-colors hover:bg-raised hover:text-fg";

// Meals as a recipe library, categorized by meal type (RULES.md §6).
export function MealsPage() {
  const all = useAtomValue(recipes.listAtom);
  const [adding, setAdding] = useState(false);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl text-fg">Meals</h1>
          <p className="heading-body text-sm text-muted">
            Recipes, categorized by meal — breakfast, lunch, dinner.
          </p>
        </div>
        <button type="button" onClick={() => setAdding(true)} className={primaryBtn}>
          <Plus className="size-4" aria-hidden /> Add recipe
        </button>
      </header>

      {all.length === 0 ? (
        <p className="rounded-card border border-dashed border-hairline p-6 text-center text-sm text-muted">
          No recipes yet. Add your first.
        </p>
      ) : (
        MEAL_TYPES.map((type) => {
          const items = all.filter((recipe) => recipe.mealType === type);
          if (items.length === 0) return null;
          return (
            <section key={type} className="flex flex-col gap-2">
              <h2 className="text-sm text-muted">{MEAL_TYPE_LABELS[type]}</h2>
              <ul className="flex flex-col gap-2">
                {items.map((recipe) => (
                  <li key={recipe.id}>
                    <RecipeCard recipe={recipe} />
                  </li>
                ))}
              </ul>
            </section>
          );
        })
      )}

      {adding ? <RecipeModal onClose={() => setAdding(false)} /> : null}
    </div>
  );
}

function RecipeCard({ recipe }: { recipe: Recipe }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-card border border-hairline bg-surface">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-fg">{recipe.title}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
            {recipe.cadence ? (
              <span className="rounded-pill bg-accent/15 px-2 py-0.5 text-accent">
                {recipe.cadence}
              </span>
            ) : null}
            {recipe.forWho.map((person) => (
              <span key={person} className="rounded-pill bg-raised px-2 py-0.5 text-muted">
                {person}
              </span>
            ))}
          </div>
        </div>
        <ChevronDown
          className={`size-4 shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="flex flex-col gap-4 border-t border-hairline p-4">
          {recipe.ingredients ? <Section title="Ingredients" body={recipe.ingredients} /> : null}
          {recipe.method ? <Section title="Method" body={recipe.method} /> : null}
          {recipe.notes ? <Section title="Notes" body={recipe.notes} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">{title}</h3>
      <p className="whitespace-pre-wrap text-sm text-muted">{body}</p>
    </div>
  );
}

function RecipeModal({ onClose }: { onClose: () => void }) {
  const upsert = useSetAtom(recipes.upsertAtom);
  const [draft, setDraft] = useState({
    title: "",
    mealType: "breakfast",
    cadence: "",
    forWho: "",
    ingredients: "",
    method: "",
    notes: "",
  });
  const set = (key: keyof typeof draft) => (value: string) =>
    setDraft((current) => ({ ...current, [key]: value }));
  const canSave = draft.title.trim().length > 0;

  return (
    <Modal
      open
      onClose={onClose}
      title="Add recipe"
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
                title: draft.title.trim(),
                mealType: draft.mealType as Recipe["mealType"],
                cadence: draft.cadence.trim(),
                forWho: draft.forWho
                  .split(",")
                  .map((name) => name.trim())
                  .filter(Boolean),
                ingredients: draft.ingredients,
                method: draft.method,
                notes: draft.notes,
              });
              onClose();
            }}
          >
            Add
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-3">
        <TextField
          label="Title"
          value={draft.title}
          onChange={set("title")}
          placeholder="Coconut chia oat pudding"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label="Meal"
            value={draft.mealType}
            onChange={set("mealType")}
            options={MEAL_TYPES}
          />
          <TextField
            label="Cadence"
            value={draft.cadence}
            onChange={set("cadence")}
            placeholder="Biweekly"
          />
        </div>
        <TextField
          label="For who (comma-separated)"
          value={draft.forWho}
          onChange={set("forWho")}
          placeholder="Matthew, Daisy"
        />
        <TextArea
          label="Ingredients"
          value={draft.ingredients}
          onChange={set("ingredients")}
          rows={5}
        />
        <TextArea label="Method" value={draft.method} onChange={set("method")} rows={5} />
        <TextArea label="Notes" value={draft.notes} onChange={set("notes")} />
      </div>
    </Modal>
  );
}
