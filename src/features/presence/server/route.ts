import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";

import { sessionMiddleware } from "@/lib/session-middleware";
import { isConflict, isNotFound } from "@/lib/db";

/** Au-delà, un membre qui n'a plus donné signe de vie n'est plus affiché. */
export const PRESENCE_TTL_MS = 60_000;

const presenceSchema = z.object({
  workspaceId: z.string().min(1),
  location: z.string().max(200),
});

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string().min(1) })),
    async (c) => {
      const db = c.get("db");
      const { workspaceId } = c.req.valid("query");
      if (!db.presence.enabled) return c.json({ data: [] });

      const member = await getMember({ db, workspaceId, userId: c.get("user").$id });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      const since = new Date(Date.now() - PRESENCE_TTL_MS).toISOString();
      const { documents } = await db.presence.list({
        where: { workspaceId, seenAt: { gt: since } },
        limit: 200,
      });

      return c.json({
        data: documents
          .filter((document) => document.location)
          .map((document) => ({
            memberId: String(document.memberId),
            location: String(document.location),
          })),
      });
    },
  )
  .put("/", sessionMiddleware, zValidator("json", presenceSchema), async (c) => {
    const db = c.get("db");
    const { workspaceId, location } = c.req.valid("json");
    if (!db.presence.enabled) return c.json({ data: { enabled: false } });

    const member = await getMember({ db, workspaceId, userId: c.get("user").$id });
    if (!member) return c.json({ error: "Unauthorized" }, 401);

    // Un document par membre, mis à jour à chaque page et à chaque signe de vie.
    const data = { workspaceId, memberId: member.$id, location, seenAt: new Date().toISOString() };
    try {
      await db.presence.update(member.$id, data);
    } catch (error) {
      if (!isNotFound(error)) throw error;
      // Deux signaux simultanés peuvent tenter de créer le document : le second le met à jour.
      await db.presence.create(data, member.$id).catch(async (createError) => {
        if (!isConflict(createError)) throw createError;
        await db.presence.update(member.$id, data);
      });
    }

    return c.json({ data: { enabled: true } });
  })
  .delete(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string().min(1) })),
    async (c) => {
      const db = c.get("db");
      const { workspaceId } = c.req.valid("query");
      if (!db.presence.enabled) return c.json({ data: { enabled: false } });

      const member = await getMember({ db, workspaceId, userId: c.get("user").$id });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      await db.presence.delete(member.$id).catch(() => undefined);
      return c.json({ data: { enabled: true } });
    },
  );

export default app;
