import type { EntityRecord } from "./entity-schema";

// Starter content seeded by the v5 migration into the default "Main House"
// namespace (ns-main). Extra recipe fields ride alongside the EntityRecord base;
// they're validated by RecipeSchema on read.
export const SEED_RECIPES: EntityRecord[] = [
  {
    id: "recipe-coconut-chia-oat-pudding",
    type: "recipe",
    namespaceId: "ns-main",
    createdAt: "2026-06-21T08:00:00.000Z",
    updatedAt: "2026-06-21T08:00:00.000Z",
    title: "Coconut Chia Oat Pudding in a Jar",
    mealType: "breakfast",
    cadence: "Biweekly",
    forWho: ["Matthew", "Daisy"],
    ingredients: [
      "4 tbsp chia seeds",
      "3 tbsp rolled oats",
      "1 cup coconut milk",
      "¼ cup regular milk, plus more if needed",
      "1–2 tbsp honey, to taste",
      "¼–½ tsp cinnamon",
      "½ tsp vanilla extract",
      "Tiny pinch of salt",
    ].join("\n"),
    method: [
      "1. In your jar, add coconut milk, regular milk, honey, cinnamon, vanilla, and salt.",
      "2. Stir or shake until the honey is mixed in.",
      "3. Add chia seeds and rolled oats.",
      "4. Stir really well.",
      "5. Wait 5–10 minutes, then stir again so the chia doesn't clump.",
      "6. Refrigerate at least 2 hours, ideally overnight.",
      "7. Before eating, stir again. If it's too thick, add a splash of regular milk.",
    ].join("\n"),
    notes: [
      "Kids won't eat it — this one's for Matthew & Daisy.",
      "",
      "Optional add-ins —",
      "Best combo: ½ banana (sliced or mashed), 1–2 tbsp chopped walnuts or pecans, 1 tbsp shredded coconut.",
      "Tropical: mango, shredded coconut, a little lime zest.",
      "",
      "Texture: with 4 tbsp chia + oats it gets pretty thick. For creamier the next day, add another 2–4 tbsp milk and stir.",
    ].join("\n"),
  } as EntityRecord,
];
