import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";

import type { Db } from "@/lib/db";
import { sessionMiddleware } from "@/lib/session-middleware";

import { createDocSchema, updateDocSchema } from "../schemas";
import type { ProjectDoc } from "../types";

const NOT_CONFIGURED = { error: "Documentation non configurée" } as const;

/** Tâches liées : uniquement des tâches existantes du même projet, sans doublon. */
const projectTaskIds = async (db: Db, projectId: string, taskIds: string[]) => {
  const ids = [...new Set(taskIds)];
  if (ids.length === 0) return { ids };
  const { documents } = await db.tasks.list({
    where: { $id: ids, projectId },
    limit: ids.length,
  });
  return documents.length === ids.length ? { ids } : { error: "Tâche introuvable dans ce projet" };
};

/** Résumé affiché dans la liste des pages. */
const summarize = (doc: ProjectDoc) => ({
  $id: doc.$id,
  title: doc.title,
  createdBy: doc.createdBy,
  updatedBy: doc.updatedBy ?? doc.createdBy,
  $createdAt: doc.$createdAt,
  $updatedAt: doc.$updatedAt,
  taskCount: doc.taskIds?.length ?? 0,
});

/** Page et membre connecté, si la page existe et que l'utilisateur fait partie de son espace. */
const getDocAccess = async (db: Db, docId: string, userId: string) => {
  const doc = await db.docs.find(docId);
  if (!doc) return null;
  const member = await getMember({ db, workspaceId: doc.workspaceId, userId });
  return member ? { doc, member } : null;
};

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ projectId: z.string().min(1) })),
    async (c) => {
      const db = c.get("db");
      const project = await db.projects.get(c.req.valid("query").projectId);
      const member = await getMember({
        db,
        workspaceId: project.workspaceId,
        userId: c.get("user").$id,
      });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      if (!db.docs.enabled) return c.json({ data: { enabled: false, documents: [] } });

      const { documents } = await db.docs.list({
        where: { projectId: project.$id },
        orderBy: { $updatedAt: "desc" },
        limit: 200,
      });
      return c.json({ data: { enabled: true, documents: documents.map(summarize) } });
    },
  )
  .get("/:docId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    if (!db.docs.enabled) return c.json(NOT_CONFIGURED, 400);

    const access = await getDocAccess(db, c.req.param("docId"), c.get("user").$id);
    if (!access) return c.json({ error: "Not found" }, 404);
    const { doc } = access;

    // Les tâches supprimées depuis disparaissent simplement des liens.
    const taskIds = doc.taskIds ?? [];
    const { documents: tasks } = taskIds.length
      ? await db.tasks.list({
          where: { $id: taskIds, projectId: doc.projectId },
          limit: taskIds.length,
        })
      : { documents: [] };

    return c.json({
      data: {
        ...summarize(doc),
        workspaceId: doc.workspaceId,
        projectId: doc.projectId,
        content: doc.content,
        tasks: tasks.map((task) => ({ $id: task.$id, name: task.name, status: task.status })),
      },
    });
  })
  .post("/", sessionMiddleware, zValidator("json", createDocSchema), async (c) => {
    const db = c.get("db");
    if (!db.docs.enabled) return c.json(NOT_CONFIGURED, 400);

    const { projectId, title, content, taskIds } = c.req.valid("json");
    const project = await db.projects.get(projectId);
    const member = await getMember({
      db,
      workspaceId: project.workspaceId,
      userId: c.get("user").$id,
    });
    if (!member) return c.json({ error: "Unauthorized" }, 401);

    const tasks = await projectTaskIds(db, project.$id, taskIds ?? []);
    if (tasks.error) return c.json({ error: tasks.error }, 400);

    const doc = await db.docs.create({
      workspaceId: project.workspaceId,
      projectId: project.$id,
      title,
      content: content ?? "",
      createdBy: member.$id,
      updatedBy: member.$id,
      taskIds: tasks.ids,
    });
    return c.json({ data: { $id: doc.$id, projectId: doc.projectId } });
  })
  .patch("/:docId", sessionMiddleware, zValidator("json", updateDocSchema), async (c) => {
    const db = c.get("db");
    if (!db.docs.enabled) return c.json(NOT_CONFIGURED, 400);

    const access = await getDocAccess(db, c.req.param("docId"), c.get("user").$id);
    if (!access) return c.json({ error: "Not found" }, 404);
    const { doc, member } = access;

    const { title, content, taskIds } = c.req.valid("json");
    let linked: string[] | undefined;
    if (taskIds) {
      const tasks = await projectTaskIds(db, doc.projectId, taskIds);
      if (tasks.error) return c.json({ error: tasks.error }, 400);
      linked = tasks.ids;
    }

    const updated = await db.docs.update(doc.$id, {
      title,
      content,
      taskIds: linked,
      updatedBy: member.$id,
    });
    return c.json({ data: { $id: updated.$id, projectId: updated.projectId } });
  })
  .delete("/:docId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    if (!db.docs.enabled) return c.json(NOT_CONFIGURED, 400);

    const access = await getDocAccess(db, c.req.param("docId"), c.get("user").$id);
    if (!access) return c.json({ error: "Not found" }, 404);
    const { doc, member } = access;

    // Comme les pièces jointes : l'auteur de la page ou un administrateur.
    if (doc.createdBy !== member.$id && member.role !== MemberRole.ADMIN) {
      return c.json({ error: "Seul l'auteur ou un administrateur peut supprimer cette page" }, 403);
    }

    await db.docs.delete(doc.$id);
    return c.json({ data: { $id: doc.$id, projectId: doc.projectId } });
  });

export default app;
