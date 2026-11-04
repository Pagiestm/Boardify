import "server-only";

import type { Db } from "@/lib/db";
import type { FileStore } from "@/lib/files";
import { Task } from "@/features/tasks/types";
import { deleteTaskRelations } from "@/features/tasks/server/cleanup";
import { closeDeletedTaskIssue } from "@/features/tasks/server/github-sync";
import { deleteProjectSprints } from "@/features/sprints/server/sprints";

const deleteProjectTasks = async (db: Db, files: FileStore, projectId: string) => {
  let documents: Task[];

  do {
    ({ documents } = await db.tasks.list({ where: { projectId }, limit: 100 }));

    await Promise.all(
      documents.map(async (document) => {
        await db.tasks.delete(document.$id);
        await Promise.all([
          closeDeletedTaskIssue(db, document),
          deleteTaskRelations(db, files, document.$id),
        ]);
      }),
    );
  } while (documents.length === 100);
};

/** Pages de documentation et formulaire public du projet (collections facultatives). */
const deleteProjectExtras = async (db: Db, projectId: string) => {
  for (const collection of [db.docs, db.intakeForms]) {
    if (!collection.enabled) continue;
    let documents: { $id: string }[];
    do {
      ({ documents } = await collection.list({ where: { projectId }, limit: 100 }));
      await Promise.all(documents.map((document) => collection.delete(document.$id)));
    } while (documents.length === 100);
  }
};

export const deleteProject = async (db: Db, files: FileStore, projectId: string) => {
  await deleteProjectTasks(db, files, projectId);
  await deleteProjectSprints(db, projectId);
  await deleteProjectExtras(db, projectId);
  await db.projects.delete(projectId);
};
