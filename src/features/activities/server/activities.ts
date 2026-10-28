import "server-only";

import { ID, type Databases } from "node-appwrite";

import { Task } from "@/features/tasks/types";

import { ACTIVITIES_ID, DATABASE_ID } from "@/config";

import { ActivityChange, ActivityType } from "../types";

interface ActivityEntry {
  type: ActivityType;
  change?: ActivityChange;
}

const sameList = (a: string[] = [], b: string[] = []) =>
  a.length === b.length && [...a].sort().join() === [...b].sort().join();

const day = (value?: string | null) => (value ? value.slice(0, 10) : null);

export const describeTaskChanges = (before: Task, after: Task): ActivityEntry[] => {
  const entries: ActivityEntry[] = [];

  if (before.status !== after.status) {
    entries.push({ type: ActivityType.STATUS, change: { from: before.status, to: after.status } });
  }
  if (before.assigneeId !== after.assigneeId) {
    entries.push({
      type: ActivityType.ASSIGNEE,
      change: { from: before.assigneeId, to: after.assigneeId },
    });
  }
  if (before.priority !== after.priority) {
    entries.push({
      type: ActivityType.PRIORITY,
      change: { from: before.priority, to: after.priority },
    });
  }
  if (
    day(before.startDate) !== day(after.startDate) ||
    day(before.dueDate) !== day(after.dueDate)
  ) {
    entries.push({
      type: ActivityType.DATES,
      change: {
        from: [before.startDate ?? "", before.dueDate ?? ""],
        to: [after.startDate ?? "", after.dueDate ?? ""],
      },
    });
  }
  if (before.name !== after.name) {
    entries.push({ type: ActivityType.NAME, change: { from: before.name, to: after.name } });
  }
  if ((before.description ?? "") !== (after.description ?? "")) {
    entries.push({ type: ActivityType.DESCRIPTION });
  }
  if (!sameList(before.labelIds, after.labelIds)) {
    entries.push({
      type: ActivityType.LABELS,
      change: { from: before.labelIds ?? [], to: after.labelIds ?? [] },
    });
  }
  if (before.projectId !== after.projectId) {
    entries.push({
      type: ActivityType.PROJECT,
      change: { from: before.projectId, to: after.projectId },
    });
  }

  return entries;
};

export const logActivities = async (
  databases: Databases,
  task: Pick<Task, "$id" | "workspaceId">,
  memberId: string | null,
  entries: ActivityEntry[],
) => {
  try {
    await Promise.all(
      entries.map(({ type, change }) =>
        databases.createDocument(DATABASE_ID, ACTIVITIES_ID, ID.unique(), {
          workspaceId: task.workspaceId,
          taskId: task.$id,
          memberId,
          type,
          data: change ? JSON.stringify(change) : null,
        }),
      ),
    );
  } catch (error) {
    console.error("Enregistrement de l'activité impossible", error);
  }
};
