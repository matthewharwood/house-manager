import { createFileRoute } from "@tanstack/react-router";

import { TodayPage } from "~/features/today/today-page";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/")({
  head: () => ({ links: buildSeoLinks({ path: "/" }) }),
  component: TodayPage,
});
