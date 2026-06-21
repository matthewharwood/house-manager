import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "~/components/page-placeholder";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({ links: buildSeoLinks({ path: "/" }) }),
  component: Today,
});

function Today() {
  return (
    <PagePlaceholder
      title="Today"
      blurb="Your day at a glance — chores, meals, pickups, and who's on."
    />
  );
}
