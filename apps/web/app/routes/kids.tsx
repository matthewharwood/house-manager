import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "~/components/page-placeholder";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/kids")({
  head: () => ({ links: buildSeoLinks({ path: "/kids" }) }),
  component: () => (
    <PagePlaceholder title="Kids" blurb="Pickup & drop-off times, events, and babysitting." />
  ),
});
