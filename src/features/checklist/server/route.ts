import { z } from "zod";
import { Hono } from "hono";
import { ID, Query, type Databases } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { Task } from "@/features/tasks/types";
import { getMember } from "@/features/members/utils";

import { sessionMiddleware } from "@/lib/session-middleware";
import { CHECKLIST_ITEMS_ID, DATABASE_ID, TASKS_ID } from "@/config";

import { ChecklistItem } from "../types";
import { POSITION_STEP } from "./items";

const titleSchema = z.string().trim().min(1, "Requis").max(500);

const canAccessTask = async (databases: Databases, taskId: string, userId: string) => {
  const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);
  const member = await getMember({ databases, workspaceId: task.workspaceId, userId });
  return member ? task : null;
};

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ taskId: z.string().min(1) })),
    async (c) => {
      const databases = c.get("databases");
      const { taskId } = c.req.valid("query");

      if (!(await canAccessTask(databases, taskId, c.get("user").$id))) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const items = await databases.listDocuments<ChecklistItem>(DATABASE_ID, CHECKLIST_ITEMS_ID, [
        Query.equal("taskId", taskId),
        Query.orderAsc("position"),
        Query.limit(500),
      ]);

      return c.json({ data: items.documents });
    },
  )
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", z.object({ taskId: z.string().min(1), title: titleSchema })),
    async (c) => {
      const databases = c.get("databases");
      const { taskId, title } = c.req.valid("json");

      const task = await canAccessTask(databases, taskId, c.get("user").$id);
      if (!task) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const { documents: last } = await databases.listDocuments<ChecklistItem>(
        DATABASE_ID,
        CHECKLIST_ITEMS_ID,
        [Query.equal("taskId", taskId), Query.orderDesc("position"), Query.limit(1)],
      );

      const item = await databases.createDocument<ChecklistItem>(
        DATABASE_ID,
        CHECKLIST_ITEMS_ID,
        ID.unique(),
        {
          workspaceId: task.workspaceId,
          taskId,
          title,
          done: false,
          position: (last[0]?.position ?? 0) + POSITION_STEP,
        },
      );

      return c.json({ data: item });
    },
  )
  .patch(
    "/:itemId",
    sessionMiddleware,
    zValidator("json", z.object({ title: titleSchema.optional(), done: z.boolean().optional() })),
    async (c) => {
      const databases = c.get("databases");
      const existing = await databases.getDocument<ChecklistItem>(
        DATABASE_ID,
        CHECKLIST_ITEMS_ID,
        c.req.param("itemId"),
      );

      if (!(await canAccessTask(databases, existing.taskId, c.get("user").$id))) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const item = await databases.updateDocument<ChecklistItem>(
        DATABASE_ID,
        CHECKLIST_ITEMS_ID,
        existing.$id,
        c.req.valid("json"),
      );

      return c.json({ data: item });
    },
  )
  .delete("/:itemId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const item = await databases.getDocument<ChecklistItem>(
      DATABASE_ID,
      CHECKLIST_ITEMS_ID,
      c.req.param("itemId"),
    );

    if (!(await canAccessTask(databases, item.taskId, c.get("user").$id))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await databases.deleteDocument(DATABASE_ID, CHECKLIST_ITEMS_ID, item.$id);

    return c.json({ data: { $id: item.$id, taskId: item.taskId } });
  });

export default app;
