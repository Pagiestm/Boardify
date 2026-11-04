import "server-only";

import { getMember } from "@/features/members/utils";

import type { Db } from "@/lib/db";

/** La tâche et le membre de l'espace qui la consulte, ou null s'il n'y a pas accès. */
export const getTaskAccess = async (db: Db, taskId: string, userId: string) => {
  const task = await db.tasks.find(taskId);
  if (!task) return null;
  const member = await getMember({ db, workspaceId: task.workspaceId, userId });
  return member ? { task, member } : null;
};
