import "server-only";

import { addDays, addMonths } from "date-fns";
import { ID, Query, type Databases } from "node-appwrite";

import { Project } from "@/features/projects/types";
import { ActivityType } from "@/features/activities/types";
import { logActivities } from "@/features/activities/server/activities";
import { createChecklistItems, listChecklistItems } from "@/features/checklist/server/items";

import { DATABASE_ID, PROJECTS_ID, TASKS_ID } from "@/config";

import { Task, TaskRecurrence } from "../types";
import { createTaskIssue } from "./github-sync";
import { getOpenStatus, isDoneStatus } from "./done";

const shift = (value: string, recurrence: TaskRecurrence) => {
  const date = new Date(value);
  if (recurrence === TaskRecurrence.DAILY) return addDays(date, 1);
  if (recurrence === TaskRecurrence.WEEKLY) return addDays(date, 7);
  return addMonths(date, 1);
};

export const createNextOccurrence = async (
  databases: Databases,
  before: Task,
  after: Task,
  memberId: string | null,
) => {
  if (!after.recurrence) return null;

  try {
    const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, after.projectId);
    if (isDoneStatus(project, before.status) || !isDoneStatus(project, after.status)) return null;

    const dueDate = shift(after.dueDate, after.recurrence).toISOString();
    const startDate = shift(after.startDate ?? after.dueDate, after.recurrence).toISOString();

    const { total: existing } = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal("projectId", after.projectId),
      Query.equal("name", after.name),
      Query.equal("dueDate", dueDate),
      Query.limit(1),
    ]);
    if (existing > 0) return null;

    const status = before.projectId === after.projectId ? before.status : getOpenStatus(project);
    const { documents: lowest } = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal("workspaceId", after.workspaceId),
      Query.equal("status", status),
      Query.orderAsc("position"),
      Query.limit(1),
    ]);

    const next = await databases.createDocument<Task>(DATABASE_ID, TASKS_ID, ID.unique(), {
      name: after.name,
      description: after.description,
      status,
      workspaceId: after.workspaceId,
      projectId: after.projectId,
      assigneeId: after.assigneeId,
      priority: after.priority,
      labelIds: after.labelIds ?? [],
      blockedBy: [],
      recurrence: after.recurrence,
      estimate: after.estimate ?? null,
      startDate,
      dueDate,
      position: (lowest[0]?.position ?? 0) + 1000,
    });

    const checklist = await listChecklistItems(databases, [after.$id]);

    await Promise.all([
      createChecklistItems(
        databases,
        next,
        checklist.map((item) => item.title),
      ),
      createTaskIssue(databases, next),
      logActivities(databases, next, memberId, [
        { type: ActivityType.CREATED, change: { from: after.$id } },
      ]),
    ]);

    return next;
  } catch (error) {
    console.error("Création de l'occurrence suivante impossible", error);
    return null;
  }
};
