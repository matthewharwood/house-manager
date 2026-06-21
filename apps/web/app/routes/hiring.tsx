import { createFileRoute } from "@tanstack/react-router";

import { HiringPage } from "~/features/hiring/hiring-page";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/hiring")({
  head: () => ({ links: buildSeoLinks({ path: "/hiring" }) }),
  component: HiringPage,
});
