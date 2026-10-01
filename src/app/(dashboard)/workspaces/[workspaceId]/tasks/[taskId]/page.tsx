import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";

import { TaskIdClient } from "./client";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage("Tâche", "Le détail d'une tâche.");

const TaskIdPage = async () => {
  const user = await getCurrent();
  if (!user) {
    redirect("/sign-in");
  }

  return <TaskIdClient />;
};

export default TaskIdPage;
