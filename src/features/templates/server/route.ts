import { z } from "zod";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";

import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, TASK_TEMPLATES_ID } from "@/config";

import { parseTemplateData, TaskTemplate, templateDataSchema } from "../types";

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string().min(1) })),
    async (c) => {
      const databases = c.get("databases");
      const { workspaceId } = c.req.valid("query");

      const member = await getMember({ databases, workspaceId, userId: c.get("user").$id });
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const templates = await databases.listDocuments<TaskTemplate>(
        DATABASE_ID,
        TASK_TEMPLATES_ID,
        [Query.equal("workspaceId", workspaceId), Query.orderAsc("name"), Query.limit(100)],
      );

      return c.json({
        data: templates.documents.map((template) => ({
          $id: template.$id,
          name: template.name,
          workspaceId: template.workspaceId,
          data: parseTemplateData(template.data),
        })),
      });
    },
  )
  .post(
    "/",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        workspaceId: z.string().min(1),
        name: z.string().trim().min(1, "Requis").max(100),
        data: templateDataSchema,
      }),
    ),
    async (c) => {
      const databases = c.get("databases");
      const { workspaceId, name, data } = c.req.valid("json");

      const member = await getMember({ databases, workspaceId, userId: c.get("user").$id });
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const template = await databases.createDocument<TaskTemplate>(
        DATABASE_ID,
        TASK_TEMPLATES_ID,
        ID.unique(),
        { workspaceId, name, data: JSON.stringify(data) },
      );

      return c.json({ data: { $id: template.$id, workspaceId } });
    },
  )
  .delete("/:templateId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const template = await databases.getDocument<TaskTemplate>(
      DATABASE_ID,
      TASK_TEMPLATES_ID,
      c.req.param("templateId"),
    );

    const member = await getMember({
      databases,
      workspaceId: template.workspaceId,
      userId: c.get("user").$id,
    });
    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await databases.deleteDocument(DATABASE_ID, TASK_TEMPLATES_ID, template.$id);

    return c.json({ data: { $id: template.$id, workspaceId: template.workspaceId } });
  });

export default app;
