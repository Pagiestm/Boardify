import { z } from "zod";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";

import { AUTH_COOKIE } from "@/features/auth/constants";
import { getMember } from "@/features/members/utils";

import { sessionMiddleware } from "@/lib/session-middleware";

import { subscribeToChanges } from ".";

/** Au-delà, la connexion est rouverte par le navigateur (durée maximale d'une fonction). */
const STREAM_DURATION_MS = 240_000;
const KEEPALIVE_MS = 20_000;

const app = new Hono().get(
  "/",
  sessionMiddleware,
  zValidator("query", z.object({ workspaceId: z.string() })),
  async (c) => {
    const user = c.get("user");
    const { workspaceId } = c.req.valid("query");
    const member = await getMember({
      db: c.get("db"),
      workspaceId,
      userId: user.$id,
    });
    if (!member) return c.json({ error: "Unauthorized" }, 401);

    const session = getCookie(c, AUTH_COOKIE) ?? "";

    return streamSSE(c, async (stream) => {
      // Le serveur ne retransmet que les changements de cet espace : le navigateur ne parle
      // jamais directement à la base.
      await new Promise<void>((resolve) => {
        let closed = false;
        let unsubscribe = () => {};

        const finish = () => {
          if (closed) return;
          closed = true;
          clearInterval(keepalive);
          clearTimeout(timeout);
          unsubscribe();
          resolve();
        };

        const keepalive = setInterval(() => {
          void stream.writeSSE({ event: "ping", data: "" }).catch(finish);
        }, KEEPALIVE_MS);
        const timeout = setTimeout(finish, STREAM_DURATION_MS);
        stream.onAbort(finish);

        unsubscribe = subscribeToChanges({
          workspaceId,
          userId: user.$id,
          session,
          onReady: () => void stream.writeSSE({ event: "ready", data: "" }).catch(finish),
          onChange: (change) =>
            void stream.writeSSE({ event: "change", data: JSON.stringify(change) }).catch(finish),
          onClose: finish,
        });
        // La source a pu se fermer pendant l'abonnement.
        if (closed) unsubscribe();
      });
    });
  },
);

export default app;
