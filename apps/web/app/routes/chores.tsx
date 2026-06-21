import { createFileRoute } from "@tanstack/react-router";

import { TaskBoard } from "~/features/tasks/task-board";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/chores")({
  head: () => ({ links: buildSeoLinks({ path: "/chores" }) }),
  component: () => (
    <TaskBoard
      area="chores"
      title="Chores"
      blurb="Dishes, laundry, garbage & recycling rotations, mail, car."
    />
  ),
});
