import { createFileRoute } from "@tanstack/react-router";

import { TaskBoard } from "~/features/tasks/task-board";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/pets")({
  head: () => ({ links: buildSeoLinks({ path: "/pets" }) }),
  component: () => (
    <TaskBoard
      area="pets"
      title="Pets"
      blurb="The dog-walking schedule and the rest of the menagerie."
    />
  ),
});
