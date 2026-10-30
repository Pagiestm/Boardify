import "server-only";

import { Databases, Models, Query, type Storage } from "node-appwrite";

import { Project } from "@/features/projects/types";
import { deleteProject } from "@/features/projects/server/cleanup";
import { deleteWorkspaceAssistant } from "@/features/assistant/server/model";

import {
  DATABASE_ID,
  LABELS_ID,
  MEMBERS_ID,
  NOTIFICATIONS_ID,
  PROJECTS_ID,
  SAVED_VIEWS_ID,
  TASK_TEMPLATES_ID,
  TASKS_ID,
} from "@/config";

/** Supprime tout ce qui appartient à un espace (projets, tâches, membres…), sauf l'espace lui-même. */
export const deleteWorkspaceChildren = async (
  databases: Databases,
  storage: Storage,
  workspaceId: string,
): Promise<void> => {
  let projects: Project[];
  do {
    ({ documents: projects } = await databases.listDocuments<Project>(DATABASE_ID, PROJECTS_ID, [
      Query.equal("workspaceId", workspaceId),
      Query.limit(25),
    ]));
    for (const project of projects) {
      await deleteProject(databases, storage, project.$id);
    }
  } while (projects.length === 25);

  for (const collectionId of [
    TASKS_ID,
    LABELS_ID,
    TASK_TEMPLATES_ID,
    SAVED_VIEWS_ID,
    NOTIFICATIONS_ID,
    MEMBERS_ID,
  ]) {
    let documents: Models.Document[];
    do {
      ({ documents } = await databases.listDocuments(DATABASE_ID, collectionId, [
        Query.equal("workspaceId", workspaceId),
        Query.limit(100),
      ]));
      await Promise.all(
        documents.map((document) =>
          databases.deleteDocument(DATABASE_ID, collectionId, document.$id),
        ),
      );
    } while (documents.length === 100);
  }

  await deleteWorkspaceAssistant(workspaceId);
};
