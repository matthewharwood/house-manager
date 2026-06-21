import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "~/components/page-placeholder";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/appointments")({
  head: () => ({ links: buildSeoLinks({ path: "/appointments" }) }),
  component: () => (
    <PagePlaceholder
      title="Appointments"
      blurb="Doctors and the rest — calls to make, dates to keep."
    />
  ),
});
