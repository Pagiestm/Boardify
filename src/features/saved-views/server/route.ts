import { z } from "zod";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";

import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, SAVED_VIEWS_ID } from "@/config";

import { parseSavedViewFilters, SavedView, savedViewFiltersSchema } from "../types";

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

      const views = await databases.listDocuments<SavedView>(DATABASE_ID, SAVED_VIEWS_ID, [
        Query.equal("workspaceId", workspaceId),
        Query.equal("memberId", member.$id),
        Query.orderAsc("name"),
        Query.limit(100),
      ]);

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
      const databases = c.get("databases");
      const { workspaceId, name, view, filters } = c.req.valid("json");

      const member = await getMember({ databases, workspaceId, userId: c.get("user").$id });
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const saved = await databases.createDocument<SavedView>(
        DATABASE_ID,
        SAVED_VIEWS_ID,
        ID.unique(),
        { workspaceId, memberId: member.$id, name, view, filters: JSON.stringify(filters) },
      );

      return c.json({ data: { $id: saved.$id, workspaceId } });
    },
  )
  .delete("/:viewId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const view = await databases.getDocument<SavedView>(
      DATABASE_ID,
      SAVED_VIEWS_ID,
      c.req.param("viewId"),
    );

    const member = await getMember({
      databases,
      workspaceId: view.workspaceId,
      userId: c.get("user").$id,
    });
    if (!member || member.$id !== view.memberId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await databases.deleteDocument(DATABASE_ID, SAVED_VIEWS_ID, view.$id);

    return c.json({ data: { $id: view.$id, workspaceId: view.workspaceId } });
  });

export default app;
