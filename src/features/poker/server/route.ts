import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getTaskAccess } from "@/features/time-tracking/server/task-access";

import { isConflict, type Db } from "@/lib/db";
import { sessionMiddleware } from "@/lib/session-middleware";

import type { PokerSession } from "../types";
import { POKER_VALUES, visibleVotes } from "../utils";

const MAX_VOTES = 200;

const taskSchema = z.object({ taskId: z.string().min(1) });

const NOT_FOUND = { error: "Tâche introuvable" };
const NOT_CONFIGURED = { error: "Planning poker non configuré" };
const NO_SESSION = { error: "Aucune estimation en cours sur cette tâche" };

/** Séance de la tâche (son identifiant est celui de la tâche), si elle est bien de cet espace. */
const findSession = async (db: Db, taskId: string, workspaceId: string) => {
  const session = await db.pokerSessions.find(taskId);
  return session?.workspaceId === workspaceId ? session : null;
};

const roundVotes = (db: Db, session: PokerSession) =>
  db.pokerVotes.list({
    where: { taskId: session.taskId, round: session.round },
    orderBy: { $createdAt: "asc" },
    limit: MAX_VOTES,
  });

/** Supprime les votes d'une tâche (tous les tours, ou ceux d'avant `beforeRound`). */
const clearVotes = async (db: Db, taskId: string, beforeRound?: number) => {
  let documents: { $id: string }[];
  do {
    ({ documents } = await db.pokerVotes.list({
      where: { taskId, ...(beforeRound ? { round: { lt: beforeRound } } : {}) },
      limit: 100,
    }));
    await Promise.all(documents.map((vote) => db.pokerVotes.delete(vote.$id)));
  } while (documents.length === 100);
};

const app = new Hono()
  /** Séance en cours et votes : les valeurs des autres restent cachées jusqu'à la révélation. */
  .get("/", sessionMiddleware, zValidator("query", taskSchema), async (c) => {
    const db = c.get("db");
    if (!db.pokerSessions.enabled || !db.pokerVotes.enabled) {
      return c.json({ data: { enabled: false as const } });
    }

    const access = await getTaskAccess(db, c.req.valid("query").taskId, c.get("user").$id);
    if (!access) return c.json(NOT_FOUND, 404);
    const { task, member } = access;

    const session = await findSession(db, task.$id, task.workspaceId);
    const votes = session ? (await roundVotes(db, session)).documents : [];

    return c.json({
      data: {
        enabled: true as const,
        memberId: member.$id,
        session: session
          ? {
              round: session.round,
              revealed: session.revealed ?? false,
              startedBy: session.startedBy,
            }
          : null,
        votes: visibleVotes(
          votes.map((vote) => ({ memberId: vote.memberId, value: vote.value })),
          { revealed: session?.revealed ?? false, memberId: member.$id },
        ),
      },
    });
  })
  .post("/start", sessionMiddleware, zValidator("json", taskSchema), async (c) => {
    const db = c.get("db");
    if (!db.pokerSessions.enabled || !db.pokerVotes.enabled) return c.json(NOT_CONFIGURED, 400);

    const access = await getTaskAccess(db, c.req.valid("json").taskId, c.get("user").$id);
    if (!access) return c.json(NOT_FOUND, 404);
    const { task, member } = access;

    const existing = await findSession(db, task.$id, task.workspaceId);
    if (existing) return c.json({ data: { taskId: task.$id } });

    // Deux membres peuvent lancer la séance au même moment : la seconde création échoue sans gêne.
    await clearVotes(db, task.$id);
    await db.pokerSessions
      .create(
        {
          workspaceId: task.workspaceId,
          taskId: task.$id,
          startedBy: member.$id,
          round: 1,
          revealed: false,
        },
        task.$id,
      )
      .catch((error) => {
        if (!isConflict(error)) throw error;
      });

    return c.json({ data: { taskId: task.$id } });
  })
  /** Vote (ou change de vote) pour le tour en cours, tant que les cartes sont cachées. */
  .post(
    "/vote",
    sessionMiddleware,
    zValidator("json", taskSchema.extend({ value: z.enum(POKER_VALUES) })),
    async (c) => {
      const db = c.get("db");
      if (!db.pokerSessions.enabled || !db.pokerVotes.enabled) return c.json(NOT_CONFIGURED, 400);

      const { taskId, value } = c.req.valid("json");
      const access = await getTaskAccess(db, taskId, c.get("user").$id);
      if (!access) return c.json(NOT_FOUND, 404);
      const { task, member } = access;

      const session = await findSession(db, task.$id, task.workspaceId);
      if (!session) return c.json(NO_SESSION, 400);
      if (session.revealed) return c.json({ error: "Les cartes sont déjà révélées" }, 400);

      const existing = await db.pokerVotes.first({
        where: { taskId: task.$id, memberId: member.$id, round: session.round },
      });
      if (existing) {
        await db.pokerVotes.update(existing.$id, { value });
      } else {
        await db.pokerVotes.create({
          workspaceId: task.workspaceId,
          taskId: task.$id,
          memberId: member.$id,
          round: session.round,
          value,
        });
      }

      return c.json({ data: { taskId: task.$id } });
    },
  )
  .post("/reveal", sessionMiddleware, zValidator("json", taskSchema), async (c) => {
    const db = c.get("db");
    if (!db.pokerSessions.enabled || !db.pokerVotes.enabled) return c.json(NOT_CONFIGURED, 400);

    const access = await getTaskAccess(db, c.req.valid("json").taskId, c.get("user").$id);
    if (!access) return c.json(NOT_FOUND, 404);

    const session = await findSession(db, access.task.$id, access.task.workspaceId);
    if (!session) return c.json(NO_SESSION, 400);

    await db.pokerSessions.update(session.$id, { revealed: true });
    return c.json({ data: { taskId: access.task.$id } });
  })
  /** Nouveau tour : votes remis à zéro, cartes de nouveau cachées. */
  .post("/round", sessionMiddleware, zValidator("json", taskSchema), async (c) => {
    const db = c.get("db");
    if (!db.pokerSessions.enabled || !db.pokerVotes.enabled) return c.json(NOT_CONFIGURED, 400);

    const access = await getTaskAccess(db, c.req.valid("json").taskId, c.get("user").$id);
    if (!access) return c.json(NOT_FOUND, 404);

    const session = await findSession(db, access.task.$id, access.task.workspaceId);
    if (!session) return c.json(NO_SESSION, 400);

    const round = session.round + 1;
    await db.pokerSessions.update(session.$id, { round, revealed: false });
    await clearVotes(db, session.taskId, round);
    return c.json({ data: { taskId: access.task.$id } });
  })
  /** Termine la séance et efface ses votes. */
  .delete("/", sessionMiddleware, zValidator("query", taskSchema), async (c) => {
    const db = c.get("db");
    if (!db.pokerSessions.enabled || !db.pokerVotes.enabled) return c.json(NOT_CONFIGURED, 400);

    const access = await getTaskAccess(db, c.req.valid("query").taskId, c.get("user").$id);
    if (!access) return c.json(NOT_FOUND, 404);

    const session = await findSession(db, access.task.$id, access.task.workspaceId);
    if (session) {
      await clearVotes(db, session.taskId);
      await db.pokerSessions.delete(session.$id).catch(() => undefined);
    }
    return c.json({ data: { taskId: access.task.$id } });
  });

export default app;
