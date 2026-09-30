import { type APIRequestContext } from "@playwright/test";

import { E2E_MARKER } from "./data";

interface Document {
  $id: string;
  name: string;
}

const json = async <T>(request: APIRequestContext, url: string): Promise<T> => {
  const response = await request.get(url);
  if (!response.ok()) {
    throw new Error(`GET ${url} → ${response.status()} ${await response.text()}`);
  }
  return (await response.json()).data as T;
};

const isMarked = (document: Document) => document.name?.startsWith(E2E_MARKER);

/**
 * Supprime les données produites par les tests, via l'API de l'application et
 * la session du compte de test — aucun scope Appwrite supplémentaire requis.
 *
 * Le garde-fou est le marqueur porté par le nom : projets et tâches sont
 * balayés dans tous les espaces du compte (les tests écrivent dans celui qui
 * existe déjà, marqué ou non), mais seuls ceux qui le portent sont supprimés.
 * Un espace n'est supprimé que s'il le porte lui-même.
 *
 * L'ordre est imposé par l'application : `DELETE /workspaces/:id` ne supprime
 * pas ses projets ni ses tâches, qui resteraient orphelins.
 */
export const cleanupTestData = async (request: APIRequestContext) => {
  const workspaces = await json<{ documents: Document[] }>(request, "/api/workspaces");

  let tasks = 0;
  let projects = 0;

  for (const workspace of workspaces.documents) {
    const taskList = await json<{ documents: Document[] }>(
      request,
      `/api/tasks?workspaceId=${workspace.$id}`,
    );
    for (const task of taskList.documents.filter(isMarked)) {
      await request.delete(`/api/tasks/${task.$id}`);
      tasks += 1;
    }

    const projectList = await json<{ documents: Document[] }>(
      request,
      `/api/projects?workspaceId=${workspace.$id}`,
    );
    for (const project of projectList.documents.filter(isMarked)) {
      await request.delete(`/api/projects/${project.$id}`);
      projects += 1;
    }
  }

  const markedWorkspaces = workspaces.documents.filter(isMarked);
  for (const workspace of markedWorkspaces) {
    await request.delete(`/api/workspaces/${workspace.$id}`);
  }

  return { workspaces: markedWorkspaces.length, projects, tasks };
};
