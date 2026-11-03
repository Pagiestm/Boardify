import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";

import { sessionMiddleware } from "@/lib/session-middleware";

const app = new Hono().get(
  "/",
  sessionMiddleware,
  zValidator("query", z.object({ taskId: z.string().min(1) })),
  async (c) => {
    const db = c.get("db");
    const { taskId } = c.req.valid("query");

    const task = await db.tasks.get(taskId);
    const member = await getMember({
      db,
      workspaceId: task.workspaceId,
      userId: c.get("user").$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const activities = await db.activities.list({
      where: { taskId },
      orderBy: { $createdAt: "asc" },
      limit: 500,
    });

    return c.json({ data: activities.documents });
  },
);

export default app;
