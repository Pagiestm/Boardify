import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { TaskViewSwitcher } from "@/features/tasks/components/task-view-switcher";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage(
  "Mes tâches",
  "Toutes vos tâches en kanban, tableau ou calendrier.",
);

const TasksPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return (
    <div className="flex h-full flex-col">
      <TaskViewSwitcher hideKanban />
    </div>
  );
};

export default TasksPage;
