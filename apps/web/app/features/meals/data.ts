import * as z from "zod";

import { EntityBaseSchema } from "~/state/entity-schema";
import { defineCollection } from "~/state/store";

// Recipes are categorized by meal type — the start of meal categorization
// (RULES.md §6). `cadence` is a free label (e.g. "Biweekly") and `forWho` tags
// who eats it; both are display-only for now (calendar projection is future).
export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snacks",
};

// One ingredient line. `amount` is per BASE serving; the card scales it by the
// chosen serving count. `amount: 0` = unquantified (e.g. a pinch) — shown via
// `note` instead of a number.
export const RecipeIngredientSchema = z.object({
  name: z.string().min(1),
  amount: z.number().default(0),
  unit: z.string().default(""),
  section: z.string().default(""),
  note: z.string().default(""),
});
export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;

export const RecipeSchema = EntityBaseSchema.extend({
  type: z.literal("recipe"),
  title: z.string().min(1),
  mealType: z.enum(MEAL_TYPES).default("breakfast"),
  cadence: z.string().default(""),
  baseServings: z.number().int().min(1).default(1),
  forWho: z.array(z.string()).default([]),
  ingredients: z.array(RecipeIngredientSchema).default([]),
  method: z.string().default(""),
  notes: z.string().default(""),
});
export type Recipe = z.infer<typeof RecipeSchema>;

export const recipes = defineCollection("recipe", RecipeSchema);

// Forgiving parser for the add-recipe form: "100g cooked rice" / "2 tbsp honey" /
// "Tiny pinch of salt" (no leading number → unquantified). One ingredient/line.
// Hoisted per biome useTopLevelRegex — a letters-only unit token ("g", "tbsp").
const UNIT_TOKEN = /^[a-z]+$/i;

function isDigit(char: string): boolean {
  return char >= "0" && char <= "9";
}

export function parseIngredientLine(line: string): RecipeIngredient {
  const trimmed = line.trim();
  // Read a leading numeric prefix (digits with at most a decimal point).
  let index = 0;
  while (
    index < trimmed.length &&
    (isDigit(trimmed.charAt(index)) || trimmed.charAt(index) === ".")
  ) {
    index += 1;
  }
  const amount = Number(trimmed.slice(0, index));
  if (index === 0 || !Number.isFinite(amount)) {
    return { name: trimmed, amount: 0, unit: "", section: "", note: "" };
  }
  // A leading letters-only token after the number is the unit; the rest is name.
  const rest = trimmed.slice(index).trim();
  const spaceAt = rest.indexOf(" ");
  if (spaceAt > 0 && UNIT_TOKEN.test(rest.slice(0, spaceAt))) {
    return {
      name: rest.slice(spaceAt + 1).trim(),
      amount,
      unit: rest.slice(0, spaceAt),
      section: "",
      note: "",
    };
  }
  return { name: rest, amount, unit: "", section: "", note: "" };
}
