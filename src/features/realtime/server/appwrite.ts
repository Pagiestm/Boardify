import "server-only";

import {
  ACTIVITIES_ID,
  ATTACHMENTS_ID,
  CHECKLIST_ITEMS_ID,
  COMMENTS_ID,
  DATABASE_ID,
  DOCS_ID,
  INTAKE_FORMS_ID,
  LABELS_ID,
  MEMBERS_ID,
  NOTIFICATIONS_ID,
  POKER_SESSIONS_ID,
  POKER_VOTES_ID,
  PRESENCE_ID,
  PROJECTS_ID,
  REMINDERS_ID,
  RETRO_ITEMS_ID,
  SAVED_VIEWS_ID,
  SPRINTS_ID,
  TASK_TEMPLATES_ID,
  TASKS_ID,
  TIME_ENTRIES_ID,
  WORKSPACES_ID,
} from "@/config";

import type { RealtimeTopic } from "../types";
import { toRealtimeChange } from "./filter";
import type { RealtimeEvent, Subscribe } from "./types";

/** Collection facultative : suivie seulement si elle est configurée. */
const optional = (collectionId: string | undefined, topic: RealtimeTopic) =>
  collectionId ? { [collectionId]: topic } : {};

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
  ...optional(PRESENCE_ID, "presence"),
  ...optional(TIME_ENTRIES_ID, "time-entries"),
  ...optional(REMINDERS_ID, "reminders"),
  ...optional(POKER_SESSIONS_ID, "poker"),
  ...optional(POKER_VOTES_ID, "poker"),
  ...optional(DOCS_ID, "docs"),
  ...optional(INTAKE_FORMS_ID, "intake-forms"),
  ...optional(RETRO_ITEMS_ID, "retro"),
};

const PING_MS = 20_000;

interface AppwriteMessage {
  type: "connected" | "event" | "response" | "error" | "pong";
  data?: {
    user?: unknown;
    events?: string[];
    payload?: Record<string, unknown>;
    message?: string;
  };
}

const text = (value: unknown) => (typeof value === "string" ? value : undefined);

/** Changement correspondant à un document Appwrite modifié. */
const toEvent = (payload: Record<string, unknown>): RealtimeEvent | null => {
  const topic = TOPICS[String(payload.$collectionId ?? "")];
  if (!topic) return null;
  return {
    topic,
    workspaceId: text(topic === "workspaces" ? payload.$id : payload.workspaceId),
    taskId: text(payload.taskId),
    userId: text(payload.userId),
  };
};

/**
 * Source Appwrite : le serveur écoute Appwrite Realtime avec la session de l'utilisateur, une
 * connexion par abonné. Le navigateur ne parle jamais directement à Appwrite.
 */
export const subscribeAppwrite: Subscribe = (subscriber) => {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!.replace(/^http/, "ws");
  const query = new URLSearchParams({ project: process.env.NEXT_PUBLIC_APPWRITE_PROJECT! });
  for (const collectionId of Object.keys(TOPICS)) {
    query.append("channels[]", `databases.${DATABASE_ID}.collections.${collectionId}.documents`);
  }

  const socket = new WebSocket(`${endpoint}/realtime?${query}`);
  let closed = false;

  const ping = setInterval(() => {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "ping" }));
  }, PING_MS);

  const stop = () => {
    if (closed) return false;
    closed = true;
    clearInterval(ping);
    if (socket.readyState <= WebSocket.OPEN) socket.close();
    return true;
  };
  const fail = () => {
    if (stop()) subscriber.onClose();
  };

  socket.addEventListener("close", fail);
  socket.addEventListener("error", fail);
  socket.addEventListener("message", (message) => {
    let parsed: AppwriteMessage;
    try {
      parsed = JSON.parse(String(message.data));
    } catch {
      return;
    }

    if (parsed.type === "connected") {
      if (!parsed.data?.user) {
        socket.send(
          JSON.stringify({ type: "authentication", data: { session: subscriber.session } }),
        );
      }
      subscriber.onReady();
      return;
    }
    if (parsed.type === "error") {
      console.error("[realtime]", parsed.data?.message);
      fail();
      return;
    }
    if (parsed.type !== "event" || !parsed.data?.payload) return;

    const event = toEvent(parsed.data.payload);
    const change = event && toRealtimeChange(event, subscriber);
    if (change) subscriber.onChange(change);
  });

  return () => {
    stop();
  };
};
