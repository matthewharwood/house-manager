import { createFileRoute } from "@tanstack/react-router";

import { TaskBoard } from "~/features/tasks/task-board";
import { buildSeoLinks } from "~/lib/seo";

export const Route = createFileRoute("/appointments")({
  head: () => ({ links: buildSeoLinks({ path: "/appointments" }) }),
  component: () => (
    <TaskBoard
      area="appointments"
      title="Appointments"
      blurb="Doctors and the rest — calls to make, dates to keep."
    />
  ),
});
