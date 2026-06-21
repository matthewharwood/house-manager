import { createFileRoute } from "@tanstack/react-router";

import { PagePlaceholder } from "~/components/page-placeholder";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/hiring")({
  head: () => ({ links: buildSeoLinks({ path: "/hiring" }) }),
  component: () => (
    <PagePlaceholder
      title="Hiring"
      blurb="The bespoke, lightweight ATS — author the post, collect resumes, slide candidates through phases."
    />
  ),
});
