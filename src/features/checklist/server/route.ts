import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";

import type { Db } from "@/lib/db";
import { sessionMiddleware } from "@/lib/session-middleware";

import { POSITION_STEP } from "./items";

const titleSchema = z.string().trim().min(1, "Requis").max(500);

const canAccessTask = async (db: Db, taskId: string, userId: string) => {
  const task = await db.tasks.get(taskId);
  const member = await getMember({ db, workspaceId: task.workspaceId, userId });
  return member ? task : null;
};

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ taskId: z.string().min(1) })),
    async (c) => {
      const db = c.get("db");
      const { taskId } = c.req.valid("query");

      if (!(await canAccessTask(db, taskId, c.get("user").$id))) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const items = await db.checklistItems.list({
        where: { taskId },
        orderBy: { position: "asc" },
        limit: 500,
      });

      return c.json({ data: items.documents });
    },
  )
  .post(
    "/",
    sessionMiddleware,
    zValidator("json", z.object({ taskId: z.string().min(1), title: titleSchema })),
    async (c) => {
      const db = c.get("db");
      const { taskId, title } = c.req.valid("json");

      const task = await canAccessTask(db, taskId, c.get("user").$id);
      if (!task) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const last = await db.checklistItems.first({
        where: { taskId },
        orderBy: { position: "desc" },
      });

      const item = await db.checklistItems.create({
        workspaceId: task.workspaceId,
        taskId,
        title,
        done: false,
        position: (last?.position ?? 0) + POSITION_STEP,
      });

      return c.json({ data: item });
    },
  )
  .patch(
    "/:itemId",
    sessionMiddleware,
    zValidator("json", z.object({ title: titleSchema.optional(), done: z.boolean().optional() })),
    async (c) => {
      const db = c.get("db");
      const existing = await db.checklistItems.get(c.req.param("itemId"));

      if (!(await canAccessTask(db, existing.taskId, c.get("user").$id))) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const item = await db.checklistItems.update(existing.$id, c.req.valid("json"));

      return c.json({ data: item });
    },
  )
  .delete("/:itemId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const item = await db.checklistItems.get(c.req.param("itemId"));

    if (!(await canAccessTask(db, item.taskId, c.get("user").$id))) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await db.checklistItems.delete(item.$id);

    return c.json({ data: { $id: item.$id, taskId: item.taskId } });
  });

export default app;
