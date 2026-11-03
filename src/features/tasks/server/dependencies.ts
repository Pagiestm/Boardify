import "server-only";

import { Project } from "@/features/projects/types";

import type { Db } from "@/lib/db";

import { Task } from "../types";
import { isDoneStatus } from "./done";

const MAX_DEPTH = 50;

const listTasksByIds = async (db: Db, ids: string[]) => {
  const tasks: Task[] = [];

  for (let index = 0; index < ids.length; index += 100) {
    const { documents } = await db.tasks.list({
      where: { $id: ids.slice(index, index + 100) },
      limit: 100,
    });
    tasks.push(...documents);
  }

  return tasks;
};

export const validateBlockedBy = async (
  db: Db,
  task: Pick<Task, "$id" | "workspaceId">,
  blockedBy: string[],
) => {
  const ids = [...new Set(blockedBy)];
  if (ids.includes(task.$id)) return "Une tâche ne peut pas se bloquer elle-même";

  const blockers = await listTasksByIds(db, ids);
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
    frontier = next.length > 0 ? await listTasksByIds(db, next) : [];
  }

  return null;
};

export interface BlockerState {
  $id: string;
  name: string;
  done: boolean;
}

export const getBlockerStates = async (db: Db, tasks: Task[]) => {
  const known = new Map(tasks.map((task) => [task.$id, task]));
  const missing = [
    ...new Set(tasks.flatMap((task) => task.blockedBy ?? []).filter((id) => !known.has(id))),
  ];
  const blockers = [...tasks, ...(missing.length > 0 ? await listTasksByIds(db, missing) : [])];

  const projectIds = [...new Set(blockers.map((task) => task.projectId))];
  const projects = new Map<string, Project>();
  for (let index = 0; index < projectIds.length; index += 100) {
    const { documents } = await db.projects.list({
      where: { $id: projectIds.slice(index, index + 100) },
      limit: 100,
    });
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
