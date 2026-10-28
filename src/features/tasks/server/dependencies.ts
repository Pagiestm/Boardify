import "server-only";

import { Query, type Databases } from "node-appwrite";

import { Project } from "@/features/projects/types";

import { DATABASE_ID, PROJECTS_ID, TASKS_ID } from "@/config";

import { Task } from "../types";
import { isDoneStatus } from "./done";

const MAX_DEPTH = 50;

const listTasksByIds = async (databases: Databases, ids: string[]) => {
  const tasks: Task[] = [];

  for (let index = 0; index < ids.length; index += 100) {
    const { documents } = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal("$id", ids.slice(index, index + 100)),
      Query.limit(100),
    ]);
    tasks.push(...documents);
  }

  return tasks;
};

export const validateBlockedBy = async (
  databases: Databases,
  task: Pick<Task, "$id" | "workspaceId">,
  blockedBy: string[],
) => {
  const ids = [...new Set(blockedBy)];
  if (ids.includes(task.$id)) return "Une tâche ne peut pas se bloquer elle-même";

  const blockers = await listTasksByIds(databases, ids);
  if (
    blockers.length !== ids.length ||
    blockers.some((blocker) => blocker.workspaceId !== task.workspaceId)
  ) {
    return "Tâche bloquante introuvable";
  }

  const visited = new Set<string>();
  let frontier = blockers;

  for (let depth = 0; frontier.length > 0 && depth < MAX_DEPTH; depth++) {
    const next = [...new Set(frontier.flatMap((current) => current.blockedBy ?? []))].filter(
      (id) => !visited.has(id),
    );

    if (next.includes(task.$id)) return "Cette dépendance créerait une boucle";

    next.forEach((id) => visited.add(id));
    frontier = next.length > 0 ? await listTasksByIds(databases, next) : [];
  }

  return null;
};

export interface BlockerState {
  $id: string;
  name: string;
  done: boolean;
}

export const getBlockerStates = async (databases: Databases, tasks: Task[]) => {
  const known = new Map(tasks.map((task) => [task.$id, task]));
  const missing = [
    ...new Set(tasks.flatMap((task) => task.blockedBy ?? []).filter((id) => !known.has(id))),
  ];
  const blockers = [
    ...tasks,
    ...(missing.length > 0 ? await listTasksByIds(databases, missing) : []),
  ];

  const projectIds = [...new Set(blockers.map((task) => task.projectId))];
  const projects = new Map<string, Project>();
  for (let index = 0; index < projectIds.length; index += 100) {
    const { documents } = await databases.listDocuments<Project>(DATABASE_ID, PROJECTS_ID, [
      Query.equal("$id", projectIds.slice(index, index + 100)),
      Query.limit(100),
    ]);
    documents.forEach((project) => projects.set(project.$id, project));
  }

  return new Map<string, BlockerState>(
    blockers.map((task) => [
      task.$id,
      {
        $id: task.$id,
        name: task.name,
        done: isDoneStatus(projects.get(task.projectId), task.status),
      },
    ]),
  );
};
