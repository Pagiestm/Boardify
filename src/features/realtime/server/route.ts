import { z } from "zod";
import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { streamSSE } from "hono/streaming";
import { zValidator } from "@hono/zod-validator";

import { AUTH_COOKIE } from "@/features/auth/constants";
import { getMember } from "@/features/members/utils";

import { sessionMiddleware } from "@/lib/session-middleware";
import {
  ACTIVITIES_ID,
  ATTACHMENTS_ID,
  CHECKLIST_ITEMS_ID,
  COMMENTS_ID,
  DATABASE_ID,
  LABELS_ID,
  MEMBERS_ID,
  NOTIFICATIONS_ID,
  PROJECTS_ID,
  SAVED_VIEWS_ID,
  SPRINTS_ID,
  TASK_TEMPLATES_ID,
  TASKS_ID,
  WORKSPACES_ID,
} from "@/config";

import { RealtimeTopic } from "../types";

/** Collections suivies, avec le sujet transmis au navigateur. */
const TOPICS: Record<string, RealtimeTopic> = {
  [TASKS_ID]: "tasks",
  [COMMENTS_ID]: "comments",
  [ACTIVITIES_ID]: "activities",
  [CHECKLIST_ITEMS_ID]: "checklist",
  [ATTACHMENTS_ID]: "attachments",
  [SPRINTS_ID]: "sprints",
  [PROJECTS_ID]: "projects",
  [MEMBERS_ID]: "members",
  [LABELS_ID]: "labels",
  [WORKSPACES_ID]: "workspaces",
  [SAVED_VIEWS_ID]: "saved-views",
  [TASK_TEMPLATES_ID]: "templates",
  [NOTIFICATIONS_ID]: "notifications",
};

/** Au-delà, la connexion est rouverte par le navigateur (durée maximale d'une fonction). */
const STREAM_DURATION_MS = 240_000;
const KEEPALIVE_MS = 20_000;

interface AppwriteMessage {
  type: "connected" | "event" | "response" | "error" | "pong";
  data?: {
    user?: unknown;
    events?: string[];
    payload?: Record<string, unknown>;
    message?: string;
  };
}

const app = new Hono().get(
  "/",
  sessionMiddleware,
  zValidator("query", z.object({ workspaceId: z.string() })),
  async (c) => {
    const user = c.get("user");
    const { workspaceId } = c.req.valid("query");
    const member = await getMember({
      databases: c.get("databases"),
      workspaceId,
      userId: user.$id,
    });
    if (!member) return c.json({ error: "Unauthorized" }, 401);

    const session = getCookie(c, AUTH_COOKIE)!;
    const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!.replace(/^http/, "ws");
    const query = new URLSearchParams({ project: process.env.NEXT_PUBLIC_APPWRITE_PROJECT! });
    for (const collectionId of Object.keys(TOPICS)) {
      query.append("channels[]", `databases.${DATABASE_ID}.collections.${collectionId}.documents`);
    }

    return streamSSE(c, async (stream) => {
      // Le serveur écoute Appwrite avec la session de l'utilisateur et ne retransmet que
      // les changements de cet espace : le navigateur ne parle jamais directement à Appwrite.
      const socket = new WebSocket(`${endpoint}/realtime?${query}`);
      let closed = false;

      const done = new Promise<void>((resolve) => {
        const finish = () => {
          if (closed) return;
          closed = true;
          clearInterval(keepalive);
          clearTimeout(timeout);
          if (socket.readyState <= WebSocket.OPEN) socket.close();
          resolve();
        };

        const keepalive = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" }));
          }
          void stream.writeSSE({ event: "ping", data: "" }).catch(finish);
        }, KEEPALIVE_MS);
        const timeout = setTimeout(finish, STREAM_DURATION_MS);

        stream.onAbort(finish);
        socket.addEventListener("close", finish);
        socket.addEventListener("error", finish);

        socket.addEventListener("message", (message) => {
          let parsed: AppwriteMessage;
          try {
            parsed = JSON.parse(String(message.data));
          } catch {
            return;
          }

          if (parsed.type === "connected") {
            if (!parsed.data?.user) {
              socket.send(JSON.stringify({ type: "authentication", data: { session } }));
            }
            void stream.writeSSE({ event: "ready", data: "" }).catch(finish);
            return;
          }
          if (parsed.type === "error") {
            console.error("[realtime]", parsed.data?.message);
            finish();
            return;
          }
          if (parsed.type !== "event" || !parsed.data?.payload) return;

          const payload = parsed.data.payload;
          const collectionId = String(payload.$collectionId ?? "");
          const topic = TOPICS[collectionId];
          if (!topic) return;

          const inWorkspace =
            topic === "workspaces"
              ? payload.$id === workspaceId
              : payload.workspaceId === workspaceId;
          if (!inWorkspace) return;
          // Les notifications ne concernent que leur destinataire.
          if (topic === "notifications" && payload.userId !== user.$id) return;

          void stream
            .writeSSE({
              event: "change",
              data: JSON.stringify({
                topic,
                taskId: typeof payload.taskId === "string" ? payload.taskId : undefined,
              }),
            })
            .catch(finish);
        });
      });

      await done;
    });
  },
);

export default app;
