import { z } from "zod";
import { Hono } from "hono";
import { Query } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { Task } from "@/features/tasks/types";
import { Member } from "@/features/members/types";

import { createAdminClient } from "@/lib/appwrite";
import { getUserIdentities } from "@/lib/users";
import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, MEMBERS_ID, NOTIFICATIONS_ID, TASKS_ID } from "@/config";

import { GITHUB_AUTHOR_PREFIX } from "@/features/comments/types";

import { Notification } from "../types";

const NOTIFICATIONS_LIMIT = 30;

const app = new Hono()
  .get("/", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const user = c.get("user");

    const [notifications, unread] = await Promise.all([
      databases.listDocuments<Notification>(DATABASE_ID, NOTIFICATIONS_ID, [
        Query.equal("userId", user.$id),
        Query.orderDesc("$createdAt"),
        Query.limit(NOTIFICATIONS_LIMIT),
      ]),
      databases.listDocuments<Notification>(DATABASE_ID, NOTIFICATIONS_ID, [
        Query.equal("userId", user.$id),
        Query.equal("read", false),
        Query.limit(1),
      ]),
    ]);

    const taskIds = [...new Set(notifications.documents.map((item) => item.taskId))];
    const actorIds = [
      ...new Set(
        notifications.documents
          .map((item) => item.actorId)
          .filter((id): id is string => !!id && !id.startsWith(GITHUB_AUTHOR_PREFIX)),
      ),
    ];

    const [tasks, actors] = await Promise.all([
      taskIds.length > 0
        ? databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
            Query.equal("$id", taskIds),
            Query.limit(NOTIFICATIONS_LIMIT),
          ])
        : null,
      actorIds.length > 0
        ? databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, [
            Query.equal("$id", actorIds),
            Query.limit(NOTIFICATIONS_LIMIT),
          ])
        : null,
    ]);

    const { users } = await createAdminClient();
    const identities = await getUserIdentities(
      users,
      (actors?.documents ?? []).map((actor) => actor.userId),
    );
    const taskNames = new Map((tasks?.documents ?? []).map((task) => [task.$id, task.name]));
    const actorNames = new Map(
      (actors?.documents ?? []).map((actor) => [actor.$id, identities.get(actor.userId)?.name]),
    );

    return c.json({
      data: {
        unreadCount: unread.total,
        notifications: notifications.documents
          .filter((item) => taskNames.has(item.taskId))
          .map((item) => ({
            $id: item.$id,
            $createdAt: item.$createdAt,
            type: item.type,
            read: item.read ?? false,
            workspaceId: item.workspaceId,
            taskId: item.taskId,
            taskName: taskNames.get(item.taskId) ?? "",
            actorName: item.actorId?.startsWith(GITHUB_AUTHOR_PREFIX)
              ? item.actorId.slice(GITHUB_AUTHOR_PREFIX.length)
              : (item.actorId && actorNames.get(item.actorId)) || null,
          })),
      },
    });
  })
  .post(
    "/read",
    sessionMiddleware,
    zValidator("json", z.object({ ids: z.array(z.string()).max(100).optional() })),
    async (c) => {
      const databases = c.get("databases");
      const user = c.get("user");
      const { ids } = c.req.valid("json");

      const unread = await databases.listDocuments<Notification>(DATABASE_ID, NOTIFICATIONS_ID, [
        Query.equal("userId", user.$id),
        Query.equal("read", false),
        ...(ids ? [Query.equal("$id", ids)] : []),
        Query.limit(100),
      ]);

      await Promise.all(
        unread.documents.map((item) =>
          databases.updateDocument(DATABASE_ID, NOTIFICATIONS_ID, item.$id, { read: true }),
        ),
      );

      return c.json({ data: { updated: unread.documents.length } });
    },
  );

export default app;
