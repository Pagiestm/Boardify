import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getUserIdentities } from "@/lib/users";
import { sessionMiddleware } from "@/lib/session-middleware";

import { GITHUB_AUTHOR_PREFIX } from "@/features/comments/types";
import { deliverDueReminders } from "@/features/reminders/server/deliver";

const NOTIFICATIONS_LIMIT = 30;

const app = new Hono()
  .get("/", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const user = c.get("user");

    // Les rappels arrivés à échéance deviennent des notifications à cette lecture.
    await deliverDueReminders(db, user.$id);

    const [notifications, unreadCount] = await Promise.all([
      db.notifications.list({
        where: { userId: user.$id },
        orderBy: { $createdAt: "desc" },
        limit: NOTIFICATIONS_LIMIT,
      }),
      db.notifications.count({ userId: user.$id, read: false }),
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
        ? db.tasks.list({ where: { $id: taskIds }, limit: NOTIFICATIONS_LIMIT })
        : null,
      actorIds.length > 0
        ? db.members.list({ where: { $id: actorIds }, limit: NOTIFICATIONS_LIMIT })
        : null,
    ]);

    const identities = await getUserIdentities(
      (actors?.documents ?? []).map((actor) => actor.userId),
    );
    const taskNames = new Map((tasks?.documents ?? []).map((task) => [task.$id, task.name]));
    const actorNames = new Map(
      (actors?.documents ?? []).map((actor) => [actor.$id, identities.get(actor.userId)?.name]),
    );

    return c.json({
      data: {
        unreadCount,
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
      const db = c.get("db");
      const user = c.get("user");
      const { ids } = c.req.valid("json");

      const unread = await db.notifications.list({
        where: { userId: user.$id, read: false, ...(ids ? { $id: ids } : {}) },
        limit: 100,
      });

      await Promise.all(
        unread.documents.map((item) => db.notifications.update(item.$id, { read: true })),
      );

      return c.json({ data: { updated: unread.documents.length } });
    },
  );

export default app;
