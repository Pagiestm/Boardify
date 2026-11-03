import "server-only";

import type { Db } from "@/lib/db";
import type { FileStore } from "@/lib/files";
import { deleteProject } from "@/features/projects/server/cleanup";
import { deleteWorkspaceAssistant } from "@/features/assistant/server/model";

/** Supprime tout ce qui appartient à un espace (projets, tâches, membres…), sauf l'espace lui-même. */
export const deleteWorkspaceChildren = async (
  db: Db,
  files: FileStore,
  workspaceId: string,
): Promise<void> => {
  let projects: { $id: string }[];
  do {
    ({ documents: projects } = await db.projects.list({ where: { workspaceId }, limit: 25 }));
    for (const project of projects) {
      await deleteProject(db, files, project.$id);
    }
  } while (projects.length === 25);

  for (const collection of [
    db.tasks,
    db.labels,
    db.taskTemplates,
    db.savedViews,
    db.notifications,
    db.members,
    ...(db.presence.enabled ? [db.presence] : []),
  ]) {
    let documents: { $id: string }[];
    do {
      ({ documents } = await collection.list({ where: { workspaceId }, limit: 100 }));
      await Promise.all(documents.map((document) => collection.delete(document.$id)));
    } while (documents.length === 100);
  }

  await deleteWorkspaceAssistant(workspaceId);
};
