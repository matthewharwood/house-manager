import { createFileRoute } from "@tanstack/react-router";

import { TaskBoard } from "~/features/tasks/task-board";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/meals")({
  head: () => ({ links: buildSeoLinks({ path: "/meals" }) }),
  component: () => (
    <TaskBoard area="meals" title="Meals" blurb="Breakfast, lunch, dinner, and meal prep." />
  ),
});
