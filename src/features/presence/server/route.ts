import { z } from "zod";
import { Hono } from "hono";
import { AppwriteException, Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";

import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, PRESENCE_ID } from "@/config";

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
      const databases = c.get("databases");
      const { workspaceId } = c.req.valid("query");
      if (!PRESENCE_ID) return c.json({ data: [] });

      const member = await getMember({ databases, workspaceId, userId: c.get("user").$id });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      const since = new Date(Date.now() - PRESENCE_TTL_MS).toISOString();
      const { documents } = await databases.listDocuments(DATABASE_ID, PRESENCE_ID, [
        Query.equal("workspaceId", workspaceId),
        Query.greaterThan("seenAt", since),
        Query.limit(200),
      ]);

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
    const databases = c.get("databases");
    const { workspaceId, location } = c.req.valid("json");
    if (!PRESENCE_ID) return c.json({ data: { enabled: false } });

    const member = await getMember({ databases, workspaceId, userId: c.get("user").$id });
    if (!member) return c.json({ error: "Unauthorized" }, 401);

    // Un document par membre, mis à jour à chaque page et à chaque signe de vie.
    const data = { workspaceId, memberId: member.$id, location, seenAt: new Date().toISOString() };
    try {
      await databases.updateDocument(DATABASE_ID, PRESENCE_ID, member.$id, data);
    } catch (error) {
      if (!(error instanceof AppwriteException) || error.code !== 404) throw error;
      await databases.createDocument(DATABASE_ID, PRESENCE_ID, member.$id, data);
    }

    return c.json({ data: { enabled: true } });
  })
  .delete(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string().min(1) })),
    async (c) => {
      const databases = c.get("databases");
      const { workspaceId } = c.req.valid("query");
      if (!PRESENCE_ID) return c.json({ data: { enabled: false } });

      const member = await getMember({ databases, workspaceId, userId: c.get("user").$id });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      await databases.deleteDocument(DATABASE_ID, PRESENCE_ID, member.$id).catch(() => undefined);
      return c.json({ data: { enabled: true } });
    },
  );

export default app;
