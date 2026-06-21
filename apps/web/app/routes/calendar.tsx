import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "~/components/page-placeholder";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/calendar")({
  head: () => ({ links: buildSeoLinks({ path: "/calendar" }) }),
  component: () => (
    <PagePlaceholder
      title="Calendar"
      blurb="Day · week · month — one shared schedule for the whole house."
    />
  ),
});
