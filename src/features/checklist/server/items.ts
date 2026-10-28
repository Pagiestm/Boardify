import "server-only";

import { ID, Query, type Databases } from "node-appwrite";

import { Task } from "@/features/tasks/types";

import { CHECKLIST_ITEMS_ID, DATABASE_ID } from "@/config";

import { ChecklistItem } from "../types";

export const POSITION_STEP = 1000;

export const createChecklistItems = (
  databases: Databases,
  task: Pick<Task, "$id" | "workspaceId">,
  titles: string[],
) =>
  Promise.all(
    titles.map((title, index) =>
      databases.createDocument(DATABASE_ID, CHECKLIST_ITEMS_ID, ID.unique(), {
        workspaceId: task.workspaceId,
        taskId: task.$id,
        title,
        done: false,
        position: (index + 1) * POSITION_STEP,
      }),
    ),
  );

export const listChecklistItems = async (databases: Databases, taskIds: string[]) => {
  const items: ChecklistItem[] = [];

  for (let index = 0; index < taskIds.length; index += 100) {
    const { documents } = await databases.listDocuments<ChecklistItem>(
      DATABASE_ID,
      CHECKLIST_ITEMS_ID,
      [
        Query.equal("taskId", taskIds.slice(index, index + 100)),
        Query.orderAsc("position"),
        Query.limit(5000),
      ],
    );
    items.push(...documents);
  }

  return items;
};
