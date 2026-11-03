import "server-only";

import type { BaseDocument } from "@/lib/db/types";
import type { Collection, Db, Where } from "@/lib/db";

import { Task } from "@/features/tasks/types";
import { Project } from "@/features/projects/types";
import { isTaskDone } from "@/features/tasks/utils";
import { parseBoardColumns } from "@/features/projects/utils";

import { NotificationType } from "../types";
import { notifyMembers } from "./notify";

const HOUR = 60 * 60 * 1000;

const listAll = async <T extends BaseDocument>(collection: Collection<T>, where: Where<T>) => {
  const documents: T[] = [];
  let cursor: string | undefined;

  do {
    const page = await collection.list({ where, limit: 100, cursorAfter: cursor });
    documents.push(...page.documents);
    cursor = page.documents.length === 100 ? page.documents[99].$id : undefined;
  } while (cursor);

  return documents;
};

export const notifyTasksDueSoon = async (db: Db, now = new Date()) => {
  const tasks: Task[] = await listAll(db.tasks, {
    dueDate: {
      gte: new Date(now.getTime() + 12 * HOUR).toISOString(),
      lt: new Date(now.getTime() + 36 * HOUR).toISOString(),
    },
  });
  if (tasks.length === 0) return 0;

  // Par lots de 100 identifiants, le maximum accepté par une requête Appwrite.
  const projectIds = [...new Set(tasks.map((task) => task.projectId))];
  const found: Project[] = [];
  for (let index = 0; index < projectIds.length; index += 100) {
    found.push(
      ...(await listAll<Project>(db.projects, { $id: projectIds.slice(index, index + 100) })),
    );
  }
  const projects = new Map(found.map((project) => [project.$id, project]));

  const alreadyNotified = new Set(
    (
      await db.notifications.list({
        where: {
          type: NotificationType.DUE_SOON,
          taskId: tasks.map((task) => task.$id),
          $createdAt: { gt: new Date(now.getTime() - 20 * HOUR).toISOString() },
        },
        limit: 500,
      })
    ).documents.map((notification) => notification.taskId),
  );

  const dueTasks = tasks.filter((task) => {
    const statusColumn = parseBoardColumns(projects.get(task.projectId)?.columnConfig).find(
      (column) => column.id === task.status,
    );
    return !isTaskDone({ status: task.status, statusColumn }) && !alreadyNotified.has(task.$id);
  });

  await Promise.all(
    dueTasks.map((task) =>
      notifyMembers(db, {
        workspaceId: task.workspaceId,
        taskId: task.$id,
        type: NotificationType.DUE_SOON,
        actorId: null,
        recipientIds: [task.assigneeId],
      }),
    ),
  );

  return dueTasks.length;
};
