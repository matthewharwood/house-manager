import { createFileRoute } from "@tanstack/react-router";

import { PeoplePage } from "~/features/people/people-page";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/people")({
  head: () => ({ links: buildSeoLinks({ path: "/people" }) }),
  component: PeoplePage,
});
