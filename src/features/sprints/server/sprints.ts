import "server-only";

import { Query, type Databases } from "node-appwrite";

import { DATABASE_ID, SPRINTS_ID, TASKS_ID } from "@/config";
import { Task } from "@/features/tasks/types";

import { Sprint } from "../types";

export const validateSprint = async (
  databases: Databases,
  sprintId: string | null | undefined,
  projectId: string,
) => {
  if (!sprintId) return null;

  try {
    const sprint = await databases.getDocument<Sprint>(DATABASE_ID, SPRINTS_ID, sprintId);
    if (sprint.projectId !== projectId) return "Ce sprint appartient à un autre projet";
    if (sprint.completed) return "Ce sprint est terminé";
    return null;
  } catch {
    return "Sprint introuvable";
  }
};

export const listSprintTasks = async (databases: Databases, sprintIds: string[]) => {
  const tasks: Task[] = [];

  for (let index = 0; index < sprintIds.length; index += 100) {
    const { documents } = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal("sprintId", sprintIds.slice(index, index + 100)),
      Query.limit(5000),
    ]);
    tasks.push(...documents);
  }

  return tasks;
};

export const deleteProjectSprints = async (databases: Databases, projectId: string) => {
  let documents: Sprint[];

  do {
    ({ documents } = await databases.listDocuments<Sprint>(DATABASE_ID, SPRINTS_ID, [
      Query.equal("projectId", projectId),
      Query.limit(100),
    ]));

    await Promise.all(
      documents.map((sprint) => databases.deleteDocument(DATABASE_ID, SPRINTS_ID, sprint.$id)),
    );
  } while (documents.length === 100);
};
