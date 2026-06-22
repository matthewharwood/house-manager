import { useAtomValue, useSetAtom } from "jotai";
import { Check, ChevronDown, ListChecks, Minus, Plus } from "lucide-react";
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

function splitSteps(method: string): string[] {
  return method
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
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
  // Opt-in "cook mode": off by default so the read view stays clean; on, it
  // turns ingredients + steps into a tickable checklist. Ephemeral — resets on
  // reload, since a recurring recipe shouldn't stay half-checked.
  const [checklist, setChecklist] = useState(false);
  const [checked, setChecked] = useState<ReadonlySet<string>>(() => new Set());
  const factor = servings / recipe.baseServings;
  const steps = splitSteps(recipe.method);
  const total = recipe.ingredients.length + steps.length;

  const toggle = (key: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

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
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              aria-pressed={checklist}
              onClick={() => setChecklist((value) => !value)}
              className={`inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 text-xs transition-colors ${
                checklist ? "border-accent text-accent" : "border-hairline text-muted hover:text-fg"
              }`}
            >
              <ListChecks className="size-3.5" aria-hidden /> Checklist
            </button>
            {checklist && total > 0 ? (
              <span className="text-xs text-faint">
                <span className="nums">{checked.size}</span>/<span className="nums">{total}</span>{" "}
                done
              </span>
            ) : null}
          </div>

          {recipe.ingredients.length > 0 ? (
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-faint">
                  Ingredients
                </h3>
                <ServingsStepper value={servings} onChange={setServings} />
              </div>
              <IngredientList
                ingredients={recipe.ingredients}
                factor={factor}
                checklist={checklist}
                checked={checked}
                onToggle={toggle}
              />
            </div>
          ) : null}

          {steps.length > 0 ? (
            <MethodList steps={steps} checklist={checklist} checked={checked} onToggle={toggle} />
          ) : null}

          {recipe.notes ? <Section title="Notes" body={recipe.notes} /> : null}
        </div>
      ) : null}
    </div>
  );
}

function CheckButton({
  checked,
  onClick,
  label,
}: {
  checked: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: custom-styled toggle; a native checkbox can't carry the HUD styling.
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-label={label}
      onClick={onClick}
      className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-[5px] border transition-colors ${
        checked
          ? "border-accent bg-accent text-accent-fg"
          : "border-hairline text-transparent hover:border-accent"
      }`}
    >
      <Check className="size-3" aria-hidden />
    </button>
  );
}

// "Days" of servings — recipes are one serving (one day); batch 1–7 days at once.
const MAX_DAYS = 7;

function ServingsStepper({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">Days</span>
      <div className="inline-flex items-center rounded-button border border-hairline">
        <button
          type="button"
          aria-label="Fewer days"
          disabled={value <= 1}
          onClick={() => onChange(Math.max(1, value - 1))}
          className="grid size-8 place-items-center text-muted transition-colors hover:text-fg disabled:opacity-30"
        >
          <Minus className="size-4" aria-hidden />
        </button>
        <span className="nums w-7 text-center text-sm text-fg">{value}</span>
        <button
          type="button"
          aria-label="More days"
          disabled={value >= MAX_DAYS}
          onClick={() => onChange(Math.min(MAX_DAYS, value + 1))}
          className="grid size-8 place-items-center text-muted transition-colors hover:text-fg disabled:opacity-30"
        >
          <Plus className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  );
}

function IngredientList({
  ingredients,
  factor,
  checklist,
  checked,
  onToggle,
}: {
  ingredients: RecipeIngredient[];
  factor: number;
  checklist: boolean;
  checked: ReadonlySet<string>;
  onToggle: (key: string) => void;
}) {
  const groups = new Map<string, { ingredient: RecipeIngredient; index: number }[]>();
  const order: string[] = [];
  ingredients.forEach((ingredient, index) => {
    if (!groups.has(ingredient.section)) {
      groups.set(ingredient.section, []);
      order.push(ingredient.section);
    }
    groups.get(ingredient.section)?.push({ ingredient, index });
  });

  return (
    <div className="flex flex-col gap-3">
      {order.map((section) => (
        <div key={section || "default"}>
          {section ? <p className="mb-1 text-xs font-medium text-faint">{section}</p> : null}
          <ul className="flex flex-col gap-1 text-sm">
            {(groups.get(section) ?? []).map(({ ingredient, index }) => {
              const key = `ing-${index}`;
              const isChecked = checklist && checked.has(key);
              return (
                <li key={key} className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-start gap-2">
                    {checklist ? (
                      <CheckButton
                        checked={checked.has(key)}
                        onClick={() => onToggle(key)}
                        label={ingredient.name}
                      />
                    ) : null}
                    <span
                      className={`min-w-0 ${isChecked ? "text-faint line-through" : "text-muted"}`}
                    >
                      {ingredient.name}
                      {ingredient.note ? (
                        <span className="text-faint"> ({ingredient.note})</span>
                      ) : null}
                    </span>
                  </span>
                  <span
                    className={`nums shrink-0 ${isChecked ? "text-faint line-through" : "text-fg"}`}
                  >
                    {formatAmount(ingredient, factor)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

function MethodList({
  steps,
  checklist,
  checked,
  onToggle,
}: {
  steps: string[];
  checklist: boolean;
  checked: ReadonlySet<string>;
  onToggle: (key: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">Method</h3>
      <ol className="flex flex-col gap-1.5 text-sm">
        {steps.map((step, index) => {
          const key = `step-${index}`;
          const isChecked = checklist && checked.has(key);
          return (
            <li key={key} className="flex items-start gap-2">
              {checklist ? (
                <CheckButton
                  checked={checked.has(key)}
                  onClick={() => onToggle(key)}
                  label={step}
                />
              ) : null}
              <span className={isChecked ? "text-faint line-through" : "text-muted"}>{step}</span>
            </li>
          );
        })}
      </ol>
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
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <SelectField
            label="Meal"
            value={draft.mealType}
            onChange={set("mealType")}
            options={MEAL_TYPES}
          />
          <TextField
            label="Cadence (optional)"
            value={draft.cadence}
            onChange={set("cadence")}
            placeholder="e.g. Biweekly"
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
