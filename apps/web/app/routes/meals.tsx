import { createFileRoute } from "@tanstack/react-router";

import { MealsPage } from "~/features/meals/meals-page";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/meals")({
  head: () => ({ links: buildSeoLinks({ path: "/meals" }) }),
  component: MealsPage,
});
