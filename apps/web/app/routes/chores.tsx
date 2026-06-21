import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "~/components/page-placeholder";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/chores")({
  head: () => ({ links: buildSeoLinks({ path: "/chores" }) }),
  component: () => (
    <PagePlaceholder
      title="Chores"
      blurb="Dishes, laundry, garbage & recycling rotations, mail, car."
    />
  ),
});
