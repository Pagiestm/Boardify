import "server-only";

import { addDays, addMonths } from "date-fns";

import { ActivityType } from "@/features/activities/types";
import { logActivities } from "@/features/activities/server/activities";
import { createChecklistItems, listChecklistItems } from "@/features/checklist/server/items";

import type { Db } from "@/lib/db";

import { Task, TaskRecurrence } from "../types";
import { createTaskIssue } from "./github-sync";
import { getOpenStatus, isDoneStatus } from "./done";

/** Date de la prochaine occurrence d'une tâche répétée. */
export const shift = (value: string, recurrence: TaskRecurrence) => {
  const date = new Date(value);
  if (recurrence === TaskRecurrence.DAILY) return addDays(date, 1);
  if (recurrence === TaskRecurrence.WEEKLY) return addDays(date, 7);
  return addMonths(date, 1);
};

export const createNextOccurrence = async (
  db: Db,
  before: Task,
  after: Task,
  memberId: string | null,
) => {
  if (!after.recurrence) return null;

  try {
    const project = await db.projects.get(after.projectId);
    if (isDoneStatus(project, before.status) || !isDoneStatus(project, after.status)) return null;

    const dueDate = shift(after.dueDate, after.recurrence).toISOString();
    const startDate = shift(after.startDate ?? after.dueDate, after.recurrence).toISOString();

    const { total: existing } = await db.tasks.list({
      where: { projectId: after.projectId, name: after.name, dueDate },
      limit: 1,
    });
    if (existing > 0) return null;

    const status = before.projectId === after.projectId ? before.status : getOpenStatus(project);
    const { documents: lowest } = await db.tasks.list({
      where: { workspaceId: after.workspaceId, status },
      orderBy: { position: "asc" },
      limit: 1,
    });

    const next = await db.tasks.create({
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

    const checklist = await listChecklistItems(db, [after.$id]);

    await Promise.all([
      createChecklistItems(
        db,
        next,
        checklist.map((item) => item.title),
      ),
      createTaskIssue(db, next),
      logActivities(db, next, memberId, [
        { type: ActivityType.CREATED, change: { from: after.$id } },
      ]),
    ]);

    return next;
  } catch (error) {
    console.error("Création de l'occurrence suivante impossible", error);
    return null;
  }
};
