import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";

import { sessionMiddleware } from "@/lib/session-middleware";

import { parseTemplateData, templateDataSchema } from "../types";

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string().min(1) })),
    async (c) => {
      const db = c.get("db");
      const { workspaceId } = c.req.valid("query");

      const member = await getMember({ db, workspaceId, userId: c.get("user").$id });
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const templates = await db.taskTemplates.list({
        where: { workspaceId },
        orderBy: { name: "asc" },
        limit: 100,
      });

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
      const db = c.get("db");
      const { workspaceId, name, data } = c.req.valid("json");

      const member = await getMember({ db, workspaceId, userId: c.get("user").$id });
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const template = await db.taskTemplates.create({
        workspaceId,
        name,
        data: JSON.stringify(data),
      });

      return c.json({ data: { $id: template.$id, workspaceId } });
    },
  )
  .delete("/:templateId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const template = await db.taskTemplates.get(c.req.param("templateId"));

    const member = await getMember({
      db,
      workspaceId: template.workspaceId,
      userId: c.get("user").$id,
    });
    if (!member || member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await db.taskTemplates.delete(template.$id);

    return c.json({ data: { $id: template.$id, workspaceId: template.workspaceId } });
  });

export default app;
