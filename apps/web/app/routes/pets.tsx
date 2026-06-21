import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "~/components/page-placeholder";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/pets")({
  head: () => ({ links: buildSeoLinks({ path: "/pets" }) }),
  component: () => (
    <PagePlaceholder title="Pets" blurb="The dog-walking schedule and the rest of the menagerie." />
  ),
});
