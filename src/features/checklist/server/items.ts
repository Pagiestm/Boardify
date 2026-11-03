import "server-only";

import type { Db } from "@/lib/db";

import { Task } from "@/features/tasks/types";

import { ChecklistItem } from "../types";

export const POSITION_STEP = 1000;

export const createChecklistItems = (
  db: Db,
  task: Pick<Task, "$id" | "workspaceId">,
  titles: string[],
) =>
  Promise.all(
    titles.map((title, index) =>
      db.checklistItems.create({
        workspaceId: task.workspaceId,
        taskId: task.$id,
        title,
        done: false,
        position: (index + 1) * POSITION_STEP,
      }),
    ),
  );

export const listChecklistItems = async (db: Db, taskIds: string[]) => {
  const items: ChecklistItem[] = [];

  for (let index = 0; index < taskIds.length; index += 100) {
    const { documents } = await db.checklistItems.list({
      where: { taskId: taskIds.slice(index, index + 100) },
      orderBy: { position: "asc" },
      limit: 5000,
    });
    items.push(...documents);
  }

  return items;
};
