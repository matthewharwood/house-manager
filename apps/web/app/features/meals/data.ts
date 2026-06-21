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

export const RecipeSchema = EntityBaseSchema.extend({
  type: z.literal("recipe"),
  title: z.string().min(1),
  mealType: z.enum(MEAL_TYPES).default("breakfast"),
  cadence: z.string().default(""),
  forWho: z.array(z.string()).default([]),
  ingredients: z.string().default(""),
  method: z.string().default(""),
  notes: z.string().default(""),
});
export type Recipe = z.infer<typeof RecipeSchema>;

export const recipes = defineCollection("recipe", RecipeSchema);
