import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";

import { sessionMiddleware } from "@/lib/session-middleware";

import { createLabelSchema } from "../schemas";

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const db = c.get("db");
      const user = c.get("user");

      const { workspaceId } = c.req.valid("query");

      const member = await getMember({ db, workspaceId, userId: user.$id });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const labels = await db.labels.list({
        where: { workspaceId },
        orderBy: { name: "asc" },
        limit: 100,
      });

      return c.json({ data: labels });
    },
  )
  .post("/", sessionMiddleware, zValidator("json", createLabelSchema), async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    const { name, color, workspaceId } = c.req.valid("json");

    const member = await getMember({ db, workspaceId, userId: user.$id });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const existing = await db.labels.list({ where: { workspaceId, name }, limit: 1 });

    if (existing.total > 0) {
      return c.json({ error: "Une étiquette porte déjà ce nom" }, 409);
    }

    const label = await db.labels.create({ name, color, workspaceId });

    return c.json({ data: label });
  })
  .delete("/:labelId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    const { labelId } = c.req.param();

    const label = await db.labels.get(labelId);

    const member = await getMember({
      db,
      workspaceId: label.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const tagged = await db.tasks.list({
      where: { workspaceId: label.workspaceId, labelIds: { has: labelId } },
      limit: 100,
    });

    await Promise.all(
      tagged.documents.map((task) =>
        db.tasks.update(task.$id, {
          labelIds: (task.labelIds as string[]).filter((id) => id !== labelId),
        }),
      ),
    );

    await db.labels.delete(labelId);

    return c.json({ data: { $id: labelId } });
  });

export default app;
