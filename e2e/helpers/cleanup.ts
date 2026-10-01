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

  let labels = 0;
  for (const workspace of workspaces.documents) {
    const labelList = await json<{ documents: Document[] }>(
      request,
      `/api/labels?workspaceId=${workspace.$id}`,
    );
    for (const label of labelList.documents.filter(isMarked)) {
      await request.delete(`/api/labels/${label.$id}`);
      labels += 1;
    }
  }

  const markedWorkspaces = workspaces.documents.filter(isMarked);
  for (const workspace of markedWorkspaces) {
    await request.delete(`/api/workspaces/${workspace.$id}`);
  }

  return { workspaces: markedWorkspaces.length, projects, tasks, labels };
};
