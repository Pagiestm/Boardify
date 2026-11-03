import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";

import { sessionMiddleware } from "@/lib/session-middleware";

import { parseSavedViewFilters, savedViewFiltersSchema } from "../types";

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

      const views = await db.savedViews.list({
        where: { workspaceId, memberId: member.$id },
        orderBy: { name: "asc" },
        limit: 100,
      });

      return c.json({
        data: views.documents.map((view) => ({
          $id: view.$id,
          name: view.name,
          view: view.view,
          filters: parseSavedViewFilters(view.filters),
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
        view: z.enum(["table", "kanban", "calendar", "gantt"]),
        filters: savedViewFiltersSchema,
      }),
    ),
    async (c) => {
      const db = c.get("db");
      const { workspaceId, name, view, filters } = c.req.valid("json");

      const member = await getMember({ db, workspaceId, userId: c.get("user").$id });
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const saved = await db.savedViews.create({
        workspaceId,
        memberId: member.$id,
        name,
        view,
        filters: JSON.stringify(filters),
      });

      return c.json({ data: { $id: saved.$id, workspaceId } });
    },
  )
  .delete("/:viewId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const view = await db.savedViews.get(c.req.param("viewId"));

    const member = await getMember({
      db,
      workspaceId: view.workspaceId,
      userId: c.get("user").$id,
    });
    if (!member || member.$id !== view.memberId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await db.savedViews.delete(view.$id);

    return c.json({ data: { $id: view.$id, workspaceId: view.workspaceId } });
  });

export default app;
