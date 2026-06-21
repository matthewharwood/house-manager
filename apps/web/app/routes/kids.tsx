import { createFileRoute } from "@tanstack/react-router";

import { TaskBoard } from "~/features/tasks/task-board";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/kids")({
  head: () => ({ links: buildSeoLinks({ path: "/kids" }) }),
  component: () => (
    <TaskBoard area="kids" title="Kids" blurb="Pickup & drop-off times, events, and babysitting." />
  ),
});
