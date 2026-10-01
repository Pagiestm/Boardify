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

  await Promise.all(
    workspaces.documents.map(async (workspace) => {
      const taskList = await json<{ documents: Document[] }>(
        request,
        `/api/tasks?workspaceId=${workspace.$id}`,
      );
      const markedTasks = taskList.documents.filter(isMarked);
      await Promise.all(markedTasks.map((task) => request.delete(`/api/tasks/${task.$id}`)));
      tasks += markedTasks.length;

      const projectList = await json<{ documents: Document[] }>(
        request,
        `/api/projects?workspaceId=${workspace.$id}`,
      );
      const markedProjects = projectList.documents.filter(isMarked);
      await Promise.all(
        markedProjects.map((project) => request.delete(`/api/projects/${project.$id}`)),
      );
      projects += markedProjects.length;
    }),
  );

  let labels = 0;
  await Promise.all(
    workspaces.documents.map(async (workspace) => {
      const labelList = await json<{ documents: Document[] }>(
        request,
        `/api/labels?workspaceId=${workspace.$id}`,
      );
      const marked = labelList.documents.filter(isMarked);
      await Promise.all(marked.map((label) => request.delete(`/api/labels/${label.$id}`)));
      labels += marked.length;
    }),
  );

  const markedWorkspaces = workspaces.documents.filter(isMarked);
  await Promise.all(
    markedWorkspaces.map((workspace) => request.delete(`/api/workspaces/${workspace.$id}`)),
  );

  return { workspaces: markedWorkspaces.length, projects, tasks, labels };
};
