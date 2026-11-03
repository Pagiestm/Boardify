import "server-only";

import type { Db } from "@/lib/db";
import { Task } from "@/features/tasks/types";

import { Sprint } from "../types";

export const validateSprint = async (
  db: Db,
  sprintId: string | null | undefined,
  projectId: string,
) => {
  if (!sprintId) return null;

  try {
    const sprint = await db.sprints.get(sprintId);
    if (sprint.projectId !== projectId) return "Ce sprint appartient à un autre projet";
    if (sprint.completed) return "Ce sprint est terminé";
    return null;
  } catch {
    return "Sprint introuvable";
  }
};

export const listSprintTasks = async (db: Db, sprintIds: string[]) => {
  const tasks: Task[] = [];

  for (let index = 0; index < sprintIds.length; index += 100) {
    const { documents } = await db.tasks.list({
      where: { sprintId: sprintIds.slice(index, index + 100) },
      limit: 5000,
    });
    tasks.push(...documents);
  }

  return tasks;
};

export const deleteProjectSprints = async (db: Db, projectId: string) => {
  let documents: Sprint[];

  do {
    ({ documents } = await db.sprints.list({ where: { projectId }, limit: 100 }));

    await Promise.all(documents.map((sprint) => db.sprints.delete(sprint.$id)));
  } while (documents.length === 100);
};
