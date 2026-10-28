import "server-only";

import { Query, type Databases, type Storage } from "node-appwrite";

import { Task } from "@/features/tasks/types";
import { deleteTaskRelations } from "@/features/tasks/server/cleanup";
import { closeDeletedTaskIssue } from "@/features/tasks/server/github-sync";
import { deleteProjectSprints } from "@/features/sprints/server/sprints";

import { DATABASE_ID, PROJECTS_ID, TASKS_ID } from "@/config";

const deleteProjectTasks = async (databases: Databases, storage: Storage, projectId: string) => {
  let documents: Task[];

  do {
    ({ documents } = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal("projectId", projectId),
      Query.limit(100),
    ]));

    await Promise.all(
      documents.map(async (document) => {
        await databases.deleteDocument(DATABASE_ID, TASKS_ID, document.$id);
        await Promise.all([
          closeDeletedTaskIssue(databases, document),
          deleteTaskRelations(databases, storage, document.$id),
        ]);
      }),
    );
  } while (documents.length === 100);
};

export const deleteProject = async (databases: Databases, storage: Storage, projectId: string) => {
  await deleteProjectTasks(databases, storage, projectId);
  await deleteProjectSprints(databases, projectId);
  await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, projectId);
};
