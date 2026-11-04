import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getTaskAccess } from "@/features/time-tracking/server/task-access";

import { sessionMiddleware } from "@/lib/session-middleware";

import { MAX_REMINDER_DAYS } from "../utils";

const DAY_MS = 24 * 60 * 60 * 1000;
/** Rappels en attente au plus, par personne et par tâche. */
const MAX_PENDING = 10;

const NOT_FOUND = { error: "Tâche introuvable" };

const app = new Hono()
  /** Rappels en attente de l'utilisateur sur une tâche (ils sont personnels). */
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ taskId: z.string().min(1) })),
    async (c) => {
      const db = c.get("db");
      if (!db.reminders.enabled) return c.json({ data: { enabled: false as const } });

      const user = c.get("user");
      const access = await getTaskAccess(db, c.req.valid("query").taskId, user.$id);
      if (!access) return c.json(NOT_FOUND, 404);

      const { documents } = await db.reminders.list({
        where: { taskId: access.task.$id, userId: user.$id, sent: false },
        orderBy: { remindAt: "asc" },
        limit: MAX_PENDING,
      });

      return c.json({ data: { enabled: true as const, reminders: documents } });
    },
  )
  .post(
    "/",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({ taskId: z.string().min(1), remindAt: z.iso.datetime({ offset: true }) }),
    ),
    async (c) => {
      const db = c.get("db");
      if (!db.reminders.enabled) return c.json({ error: "Rappels non configurés" }, 400);

      const user = c.get("user");
      const { taskId, remindAt } = c.req.valid("json");
      const access = await getTaskAccess(db, taskId, user.$id);
      if (!access) return c.json(NOT_FOUND, 404);

      const date = new Date(remindAt);
      if (date.getTime() < Date.now() - 60_000) {
        return c.json({ error: "Choisissez une date à venir" }, 400);
      }
      if (date.getTime() > Date.now() + MAX_REMINDER_DAYS * DAY_MS) {
        return c.json({ error: "Un rappel se programme au plus un an à l'avance" }, 400);
      }

      const pending = await db.reminders.count({ taskId, userId: user.$id, sent: false });
      if (pending >= MAX_PENDING) {
        return c.json({ error: "Trop de rappels en attente sur cette tâche" }, 400);
      }

      const reminder = await db.reminders.create({
        workspaceId: access.task.workspaceId,
        taskId,
        userId: user.$id,
        remindAt: date.toISOString(),
        sent: false,
      });

      return c.json({ data: reminder });
    },
  )
  /** Chacun ne supprime que ses propres rappels. */
  .delete("/:reminderId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    if (!db.reminders.enabled) return c.json({ error: "Rappels non configurés" }, 400);

    const reminder = await db.reminders.find(c.req.param("reminderId"));
    if (!reminder || reminder.userId !== c.get("user").$id) {
      return c.json({ error: "Rappel introuvable" }, 404);
    }

    await db.reminders.delete(reminder.$id);
    return c.json({ data: { $id: reminder.$id, taskId: reminder.taskId } });
  });

export default app;
