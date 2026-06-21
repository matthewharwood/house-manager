import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "~/components/page-placeholder";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/meals")({
  head: () => ({ links: buildSeoLinks({ path: "/meals" }) }),
  component: () => (
    <PagePlaceholder
      title="Meals"
      blurb="Breakfast, lunch, dinner, and meal prep — recipes and the week's plan."
    />
  ),
});
