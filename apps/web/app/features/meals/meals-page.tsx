import { useAtomValue, useSetAtom } from "jotai";
import { ChevronDown, Minus, Plus } from "lucide-react";
import { useState } from "react";

import { SelectField, TextArea, TextField } from "~/components/ui/field";
import { Modal } from "~/components/ui/modal";

import {
  MEAL_TYPE_LABELS,
  MEAL_TYPES,
  parseIngredientLine,
  type Recipe,
  type RecipeIngredient,
  recipes,
} from "./data";

const primaryBtn =
  "inline-flex items-center gap-1.5 rounded-button bg-accent px-3 py-2 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90";
const ghostBtn =
  "inline-flex items-center gap-1.5 rounded-button border border-hairline px-3 py-1.5 text-xs text-muted transition-colors hover:bg-raised hover:text-fg";

// Round to at most 2 decimals and drop trailing zeros (300, 0.75, 12).
function formatAmount(ingredient: RecipeIngredient, factor: number): string {
  if (ingredient.amount <= 0) return "";
  const value = Math.round(ingredient.amount * factor * 100) / 100;
  return ingredient.unit ? `${value} ${ingredient.unit}` : `${value}`;
}

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
  const [servings, setServings] = useState(recipe.baseServings);
  const factor = servings / recipe.baseServings;

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
          {recipe.ingredients.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-faint">
                  Ingredients
                </h3>
                <ServingsStepper
                  value={servings}
                  base={recipe.baseServings}
                  onChange={setServings}
                />
              </div>
              <IngredientList ingredients={recipe.ingredients} factor={factor} />
            </div>
          ) : null}
          {recipe.method ? <Section title="Method" body={recipe.method} /> : null}
          {recipe.notes ? <Section title="Notes" body={recipe.notes} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function ServingsStepper({
  value,
  base,
  onChange,
}: {
  value: number;
  base: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">Servings</span>
      <div className="inline-flex items-center rounded-button border border-hairline">
        <button
          type="button"
          aria-label="Fewer servings"
          disabled={value <= 1}
          onClick={() => onChange(Math.max(1, value - 1))}
          className="grid size-8 place-items-center text-muted transition-colors hover:text-fg disabled:opacity-30"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="nums w-7 text-center text-sm text-fg">{value}</span>
        <button
          type="button"
          aria-label="More servings"
          onClick={() => onChange(value + 1)}
          className="grid size-8 place-items-center text-muted transition-colors hover:text-fg"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
      {value !== base ? (
        <span className="text-xs text-faint">
          ×{Math.round((value / base) * 100) / 100} of {base}
        </span>
      ) : null}
    </div>
  );
}

function IngredientList({
  ingredients,
  factor,
}: {
  ingredients: RecipeIngredient[];
  factor: number;
}) {
  const groups = new Map<string, RecipeIngredient[]>();
  const order: string[] = [];
  for (const ingredient of ingredients) {
    if (!groups.has(ingredient.section)) {
      groups.set(ingredient.section, []);
      order.push(ingredient.section);
    }
    groups.get(ingredient.section)?.push(ingredient);
  }

  return (
    <div className="flex flex-col gap-3">
      {order.map((section) => (
        <div key={section || "default"}>
          {section ? <p className="mb-1 text-xs font-medium text-faint">{section}</p> : null}
          <ul className="flex flex-col gap-1 text-sm">
            {(groups.get(section) ?? []).map((ingredient, index) => (
              <li
                key={`${ingredient.name}-${index}`}
                className="flex items-baseline justify-between gap-3"
              >
                <span className="min-w-0 text-muted">
                  {ingredient.name}
                  {ingredient.note ? (
                    <span className="text-faint"> ({ingredient.note})</span>
                  ) : null}
                </span>
                <span className="nums shrink-0 text-fg">{formatAmount(ingredient, factor)}</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
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
    baseServings: "1",
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
                baseServings: Math.max(1, Math.round(Number(draft.baseServings) || 1)),
                forWho: draft.forWho
                  .split(",")
                  .map((name) => name.trim())
                  .filter(Boolean),
                ingredients: draft.ingredients
                  .split("\n")
                  .map(parseIngredientLine)
                  .filter((ingredient) => ingredient.name.length > 0),
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
          placeholder="Kimchi dill egg bowl"
        />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
            placeholder="Every 3 days"
          />
          <TextField
            label="Base servings"
            type="number"
            value={draft.baseServings}
            onChange={set("baseServings")}
          />
        </div>
        <TextField
          label="For who (comma-separated)"
          value={draft.forWho}
          onChange={set("forWho")}
          placeholder="Wife"
        />
        <TextArea
          label="Ingredients (one per line, e.g. “100g cooked rice”)"
          value={draft.ingredients}
          onChange={set("ingredients")}
          rows={6}
        />
        <TextArea label="Method" value={draft.method} onChange={set("method")} rows={5} />
        <TextArea label="Notes" value={draft.notes} onChange={set("notes")} />
      </div>
    </Modal>
  );
}
