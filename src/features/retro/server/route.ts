import { z } from "zod";
import { Hono } from "hono";
import { addDays } from "date-fns";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";
import { TaskPriority, TaskStatus } from "@/features/tasks/types";
import { parseBoardColumns } from "@/features/projects/utils";
import { getOpenStatus } from "@/features/tasks/server/done";
import { createTask } from "@/features/tasks/server/mutations";

import { sessionMiddleware } from "@/lib/session-middleware";
import type { Db } from "@/lib/db";

import { createRetroItemSchema, retroTaskSchema, updateRetroItemSchema } from "../schemas";

const DISABLED = { error: "Rétrospectives non configurées" } as const;
const TASK_NAME_MAX = 200;
const TASK_DUE_DAYS = 7;

/** Sprint et membre de son espace ; null si le sprint n'existe pas ou n'est pas accessible. */
const getSprintMember = async (db: Db, sprintId: string, userId: string) => {
  if (!db.sprints.enabled) return null;
  const sprint = await db.sprints.find(sprintId);
  if (!sprint) return null;
  const member = await getMember({ db, workspaceId: sprint.workspaceId, userId });
  return member ? { sprint, member } : null;
};

/** Élément et membre de son espace ; null si l'élément n'existe pas ou n'est pas accessible. */
const getItemMember = async (db: Db, itemId: string, userId: string) => {
  const item = await db.retroItems.find(itemId);
  if (!item) return null;
  const member = await getMember({ db, workspaceId: item.workspaceId, userId });
  return member ? { item, member } : null;
};

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ sprintId: z.string().min(1) })),
    async (c) => {
      const db = c.get("db");
      if (!db.retroItems.enabled) {
        return c.json({ data: { enabled: false as boolean, items: [] } });
      }

      const access = await getSprintMember(db, c.req.valid("query").sprintId, c.get("user").$id);
      if (!access) {
        return c.json({ error: "Sprint introuvable" }, 404);
      }

      const { documents } = await db.retroItems.list({
        where: { sprintId: access.sprint.$id },
        orderBy: { $createdAt: "asc" },
        limit: 500,
      });

      return c.json({ data: { enabled: true as boolean, items: documents } });
    },
  )
  .post("/", sessionMiddleware, zValidator("json", createRetroItemSchema), async (c) => {
    const db = c.get("db");
    if (!db.retroItems.enabled) return c.json(DISABLED, 400);

    const { sprintId, kind, content } = c.req.valid("json");
    const access = await getSprintMember(db, sprintId, c.get("user").$id);
    if (!access) {
      return c.json({ error: "Sprint introuvable" }, 404);
    }

    const item = await db.retroItems.create({
      workspaceId: access.sprint.workspaceId,
      sprintId: access.sprint.$id,
      memberId: access.member.$id,
      kind,
      content,
      taskId: null,
    });

    return c.json({ data: item });
  })
  .patch("/:itemId", sessionMiddleware, zValidator("json", updateRetroItemSchema), async (c) => {
    const db = c.get("db");
    if (!db.retroItems.enabled) return c.json(DISABLED, 400);

    const access = await getItemMember(db, c.req.param("itemId"), c.get("user").$id);
    if (!access) {
      return c.json({ error: "Élément introuvable" }, 404);
    }
    // Chacun ne modifie que ce qu'il a écrit.
    if (access.item.memberId !== access.member.$id) {
      return c.json({ error: "Vous ne pouvez modifier que vos propres éléments" }, 403);
    }

    const { kind, content } = c.req.valid("json");
    const item = await db.retroItems.update(access.item.$id, { kind, content });

    return c.json({ data: item });
  })
  .delete("/:itemId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    if (!db.retroItems.enabled) return c.json(DISABLED, 400);

    const access = await getItemMember(db, c.req.param("itemId"), c.get("user").$id);
    if (!access) {
      return c.json({ error: "Élément introuvable" }, 404);
    }
    if (access.item.memberId !== access.member.$id) {
      return c.json({ error: "Vous ne pouvez supprimer que vos propres éléments" }, 403);
    }

    // La tâche éventuellement créée depuis cette action est conservée.
    await db.retroItems.delete(access.item.$id);

    return c.json({ data: { $id: access.item.$id, sprintId: access.item.sprintId } });
  })
  /** Transforme une action en tâche du projet du sprint ; l'action garde le lien vers la tâche. */
  .post("/:itemId/task", sessionMiddleware, zValidator("json", retroTaskSchema), async (c) => {
    const db = c.get("db");
    if (!db.retroItems.enabled) return c.json(DISABLED, 400);

    const access = await getItemMember(db, c.req.param("itemId"), c.get("user").$id);
    if (!access) {
      return c.json({ error: "Élément introuvable" }, 404);
    }
    const { item, member } = access;
    if (item.kind !== "action") {
      return c.json({ error: "Seules les actions deviennent des tâches" }, 400);
    }
    if (item.taskId) {
      return c.json({ error: "Une tâche existe déjà pour cette action" }, 409);
    }

    const sprint = db.sprints.enabled ? await db.sprints.find(item.sprintId) : null;
    if (!sprint || sprint.workspaceId !== item.workspaceId) {
      return c.json({ error: "Sprint introuvable" }, 404);
    }
    const project = await db.projects.find(sprint.projectId);
    if (!project || project.workspaceId !== item.workspaceId) {
      return c.json({ error: "Projet introuvable" }, 404);
    }

    const { assigneeId, sprintId } = c.req.valid("json");
    const columns = parseBoardColumns(project.columnConfig);
    const todo = columns.find((column) => column.id === TaskStatus.TODO && !column.done);
    const [firstLine] = item.content.split("\n");
    const name =
      firstLine.length > TASK_NAME_MAX ? `${firstLine.slice(0, TASK_NAME_MAX - 1)}…` : firstLine;
    const now = new Date();

    // Projet, assigné et sprint sont vérifiés par createTask (même espace, sprint du projet).
    const result = await createTask(db, member.$id, {
      name,
      description:
        item.content !== name
          ? `${item.content}\n\n_Action de la rétrospective du sprint « ${sprint.name} »._`
          : `_Action de la rétrospective du sprint « ${sprint.name} »._`,
      status: todo?.id ?? getOpenStatus(project),
      workspaceId: item.workspaceId,
      projectId: project.$id,
      assigneeId: assigneeId ?? member.$id,
      priority: TaskPriority.MEDIUM,
      startDate: now,
      dueDate: addDays(now, TASK_DUE_DAYS),
      sprintId: sprintId ?? null,
    });
    if (!result.data) {
      return c.json({ error: result.error }, 400);
    }

    const updated = await db.retroItems.update(item.$id, { taskId: result.data.$id });

    return c.json({ data: { item: updated, task: result.data } });
  });

export default app;
