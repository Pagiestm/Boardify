import { z } from "zod";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";

import { DATABASE_ID, LABELS_ID, TASKS_ID } from "@/config";
import { sessionMiddleware } from "@/lib/session-middleware";

import { Label } from "../types";
import { createLabelSchema } from "../schemas";

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");

      const { workspaceId } = c.req.valid("query");

      const member = await getMember({ databases, workspaceId, userId: user.$id });

      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const labels = await databases.listDocuments<Label>(DATABASE_ID, LABELS_ID, [
        Query.equal("workspaceId", workspaceId),
        Query.orderAsc("name"),
        Query.limit(100),
      ]);

      return c.json({ data: labels });
    },
  )
  .post("/", sessionMiddleware, zValidator("json", createLabelSchema), async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");

    const { name, color, workspaceId } = c.req.valid("json");

    const member = await getMember({ databases, workspaceId, userId: user.$id });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const existing = await databases.listDocuments<Label>(DATABASE_ID, LABELS_ID, [
      Query.equal("workspaceId", workspaceId),
      Query.equal("name", name),
      Query.limit(1),
    ]);

    if (existing.total > 0) {
      return c.json({ error: "Une étiquette porte déjà ce nom" }, 409);
    }

    const label = await databases.createDocument<Label>(DATABASE_ID, LABELS_ID, ID.unique(), {
      name,
      color,
      workspaceId,
    });

    return c.json({ data: label });
  })
  .delete("/:labelId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");

    const { labelId } = c.req.param();

    const label = await databases.getDocument<Label>(DATABASE_ID, LABELS_ID, labelId);

    const member = await getMember({
      databases,
      workspaceId: label.workspaceId,
      userId: user.$id,
    });

    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const tagged = await databases.listDocuments(DATABASE_ID, TASKS_ID, [
      Query.equal("workspaceId", label.workspaceId),
      Query.contains("labelIds", labelId),
      Query.limit(100),
    ]);

    await Promise.all(
      tagged.documents.map((task) =>
        databases.updateDocument(DATABASE_ID, TASKS_ID, task.$id, {
          labelIds: (task.labelIds as string[]).filter((id) => id !== labelId),
        }),
      ),
    );

    await databases.deleteDocument(DATABASE_ID, LABELS_ID, labelId);

    return c.json({ data: { $id: labelId } });
  });

export default app;
