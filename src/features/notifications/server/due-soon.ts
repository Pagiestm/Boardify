import "server-only";

import { Query, type Databases } from "node-appwrite";

import { Task } from "@/features/tasks/types";
import { Project } from "@/features/projects/types";
import { isTaskDone } from "@/features/tasks/utils";
import { parseBoardColumns } from "@/features/projects/utils";

import { DATABASE_ID, NOTIFICATIONS_ID, PROJECTS_ID, TASKS_ID } from "@/config";

import { NotificationType } from "../types";
import { notifyMembers } from "./notify";

const HOUR = 60 * 60 * 1000;

const listAll = async <T extends Task | Project>(
  databases: Databases,
  collectionId: string,
  queries: string[],
) => {
  const documents: T[] = [];
  let cursor: string | undefined;

  do {
    const page = await databases.listDocuments<T>(DATABASE_ID, collectionId, [
      ...queries,
      Query.limit(100),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ]);
    documents.push(...page.documents);
    cursor = page.documents.length === 100 ? page.documents[99].$id : undefined;
  } while (cursor);

  return documents;
};

export const notifyTasksDueSoon = async (databases: Databases, now = new Date()) => {
  const tasks = await listAll<Task>(databases, TASKS_ID, [
    Query.greaterThanEqual("dueDate", new Date(now.getTime() + 12 * HOUR).toISOString()),
    Query.lessThan("dueDate", new Date(now.getTime() + 36 * HOUR).toISOString()),
  ]);
  if (tasks.length === 0) return 0;

  const projectIds = [...new Set(tasks.map((task) => task.projectId))];
  const projects = new Map(
    (await listAll<Project>(databases, PROJECTS_ID, [Query.equal("$id", projectIds)])).map(
      (project) => [project.$id, project],
    ),
  );

  const alreadyNotified = new Set(
    (
      await databases.listDocuments(DATABASE_ID, NOTIFICATIONS_ID, [
        Query.equal("type", NotificationType.DUE_SOON),
        Query.equal(
          "taskId",
          tasks.map((task) => task.$id),
        ),
        Query.greaterThan("$createdAt", new Date(now.getTime() - 20 * HOUR).toISOString()),
        Query.limit(500),
      ])
    ).documents.map((notification) => notification.taskId as string),
  );

  const dueTasks = tasks.filter((task) => {
    const statusColumn = parseBoardColumns(projects.get(task.projectId)?.columnConfig).find(
      (column) => column.id === task.status,
    );
    return !isTaskDone({ status: task.status, statusColumn }) && !alreadyNotified.has(task.$id);
  });

  await Promise.all(
    dueTasks.map((task) =>
      notifyMembers(databases, {
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
