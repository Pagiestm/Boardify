import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";

import type { Db } from "@/lib/db";
import { sessionMiddleware } from "@/lib/session-middleware";

import type { TimeEntry } from "../types";
import { MAX_ENTRY_MINUTES, entrySeconds, summarizeEntries } from "../utils";
import { getTaskAccess } from "./task-access";

const DAY_MS = 24 * 60 * 60 * 1000;
const REPORT_LIMIT = 5000;

const NOT_FOUND = { error: "Tâche introuvable" };

/** Durée en dessous de laquelle un chronomètre arrêté n'est pas gardé (démarrage par erreur). */
const MIN_TIMER_SECONDS = 60;

/** Arrête les chronomètres en cours du membre dans l'espace. */
const stopRunning = async (db: Db, workspaceId: string, memberId: string) => {
  const { documents } = await db.timeEntries.list({
    where: { workspaceId, memberId, endedAt: null },
    limit: 10,
  });
  const now = new Date();
  await Promise.all(
    documents.map((entry) =>
      entrySeconds(entry, now) < MIN_TIMER_SECONDS
        ? db.timeEntries.delete(entry.$id)
        : db.timeEntries.update(entry.$id, { endedAt: now.toISOString() }),
    ),
  );
};

/** Entrées des tâches d'un sprint, par lots de 100 tâches. */
const sprintEntries = async (db: Db, sprintId: string) => {
  const { documents: tasks } = await db.tasks.list({ where: { sprintId }, limit: REPORT_LIMIT });
  const taskIds = tasks.map((task) => task.$id);
  const entries: TimeEntry[] = [];
  for (let index = 0; index < taskIds.length; index += 100) {
    const { documents } = await db.timeEntries.list({
      where: { taskId: taskIds.slice(index, index + 100) },
      limit: REPORT_LIMIT,
    });
    entries.push(...documents);
  }
  return entries;
};

const app = new Hono()
  /** Temps passé sur une tâche, et le chronomètre en cours du membre (sur n'importe quelle tâche). */
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ taskId: z.string().min(1) })),
    async (c) => {
      const db = c.get("db");
      if (!db.timeEntries.enabled) return c.json({ data: { enabled: false as const } });

      const access = await getTaskAccess(db, c.req.valid("query").taskId, c.get("user").$id);
      if (!access) return c.json(NOT_FOUND, 404);
      const { task, member } = access;

      const [entries, running] = await Promise.all([
        db.timeEntries.list({
          where: { taskId: task.$id },
          orderBy: { startedAt: "desc" },
          limit: 500,
        }),
        db.timeEntries.first({
          where: { workspaceId: task.workspaceId, memberId: member.$id, endedAt: null },
        }),
      ]);
      const runningTask =
        running && running.taskId !== task.$id ? await db.tasks.find(running.taskId) : null;

      return c.json({
        data: {
          enabled: true as const,
          memberId: member.$id,
          entries: entries.documents,
          running: running
            ? { ...running, taskName: running.taskId === task.$id ? task.name : runningTask?.name }
            : null,
        },
      });
    },
  )
  /** Démarre le chronomètre sur une tâche ; celui en cours ailleurs s'arrête. */
  .post(
    "/start",
    sessionMiddleware,
    zValidator("json", z.object({ taskId: z.string().min(1) })),
    async (c) => {
      const db = c.get("db");
      if (!db.timeEntries.enabled) return c.json({ error: "Suivi du temps non configuré" }, 400);

      const access = await getTaskAccess(db, c.req.valid("json").taskId, c.get("user").$id);
      if (!access) return c.json(NOT_FOUND, 404);
      const { task, member } = access;

      await stopRunning(db, task.workspaceId, member.$id);
      const entry = await db.timeEntries.create({
        workspaceId: task.workspaceId,
        taskId: task.$id,
        memberId: member.$id,
        startedAt: new Date().toISOString(),
        endedAt: null,
      });

      return c.json({ data: entry });
    },
  )
  /** Arrête le chronomètre en cours du membre dans l'espace. */
  .post(
    "/stop",
    sessionMiddleware,
    zValidator("json", z.object({ workspaceId: z.string().min(1) })),
    async (c) => {
      const db = c.get("db");
      if (!db.timeEntries.enabled) return c.json({ error: "Suivi du temps non configuré" }, 400);

      const { workspaceId } = c.req.valid("json");
      const member = await getMember({ db, workspaceId, userId: c.get("user").$id });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      await stopRunning(db, workspaceId, member.$id);
      return c.json({ data: { workspaceId } });
    },
  )
  /** Temps saisi après coup : une durée qui se termine à `endedAt` (maintenant par défaut). */
  .post(
    "/",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        taskId: z.string().min(1),
        minutes: z.number().int().min(1).max(MAX_ENTRY_MINUTES),
        endedAt: z.iso.datetime({ offset: true }).optional(),
        note: z.string().trim().max(500).optional(),
      }),
    ),
    async (c) => {
      const db = c.get("db");
      if (!db.timeEntries.enabled) return c.json({ error: "Suivi du temps non configuré" }, 400);

      const { taskId, minutes, endedAt, note } = c.req.valid("json");
      const access = await getTaskAccess(db, taskId, c.get("user").$id);
      if (!access) return c.json(NOT_FOUND, 404);
      const { task, member } = access;

      const end = endedAt ? new Date(endedAt) : new Date();
      if (end.getTime() > Date.now() + 5 * 60 * 1000 || end.getTime() < Date.now() - 365 * DAY_MS) {
        return c.json({ error: "Date invalide" }, 400);
      }

      const entry = await db.timeEntries.create({
        workspaceId: task.workspaceId,
        taskId: task.$id,
        memberId: member.$id,
        startedAt: new Date(end.getTime() - minutes * 60 * 1000).toISOString(),
        endedAt: end.toISOString(),
        note: note || null,
      });

      return c.json({ data: entry });
    },
  )
  /** Un membre ne supprime que ses propres entrées. */
  .delete("/:entryId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    if (!db.timeEntries.enabled) return c.json({ error: "Suivi du temps non configuré" }, 400);

    const entry = await db.timeEntries.find(c.req.param("entryId"));
    if (!entry) return c.json({ error: "Entrée introuvable" }, 404);

    const member = await getMember({
      db,
      workspaceId: entry.workspaceId,
      userId: c.get("user").$id,
    });
    if (!member || member.$id !== entry.memberId) return c.json({ error: "Unauthorized" }, 401);

    await db.timeEntries.delete(entry.$id);
    return c.json({ data: { $id: entry.$id, taskId: entry.taskId } });
  })
  /** Temps par membre sur un sprint, ou sur une période (7 derniers jours par défaut). */
  .get(
    "/report",
    sessionMiddleware,
    zValidator(
      "query",
      z.object({
        workspaceId: z.string().min(1),
        sprintId: z.string().min(1).optional(),
        days: z.coerce.number().int().min(1).max(365).default(7),
      }),
    ),
    async (c) => {
      const db = c.get("db");
      if (!db.timeEntries.enabled) return c.json({ data: { enabled: false as const } });

      const { workspaceId, sprintId, days } = c.req.valid("query");
      const member = await getMember({ db, workspaceId, userId: c.get("user").$id });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      let entries: TimeEntry[];
      if (sprintId) {
        const sprint = db.sprints.enabled ? await db.sprints.find(sprintId) : null;
        if (!sprint || sprint.workspaceId !== workspaceId) {
          return c.json({ error: "Sprint introuvable" }, 404);
        }
        entries = await sprintEntries(db, sprint.$id);
      } else {
        const since = new Date(Date.now() - days * DAY_MS).toISOString();
        ({ documents: entries } = await db.timeEntries.list({
          where: { workspaceId, startedAt: { gte: since } },
          limit: REPORT_LIMIT,
        }));
      }

      return c.json({ data: { enabled: true as const, ...summarizeEntries(entries) } });
    },
  );

export default app;
