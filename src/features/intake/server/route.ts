import { randomBytes } from "node:crypto";

import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import { parseBoardColumns } from "@/features/projects/utils";
import { TaskPriority } from "@/features/tasks/types";
import { createTask } from "@/features/tasks/server/mutations";

import type { Db } from "@/lib/db";
import { sessionMiddleware } from "@/lib/session-middleware";

import type { IntakeForm } from "../types";
import { INTAKE_VIA } from "../constants";
import { intakeSettingsSchema, intakeSubmissionSchema } from "../schemas";
import { INTAKE_DUE_DAYS, buildIntakeDescription, clientIp, createRateLimiter } from "../utils";
import { getPublicIntakeForm } from "./public";

const NOT_CONFIGURED = { error: "Formulaire public non configuré" } as const;
/** Même réponse pour un formulaire inconnu, désactivé ou une adresse mal formée. */
const NOT_FOUND = { error: "Not found" } as const;

/** Par visiteur : 5 demandes par tranche de 10 minutes, tous formulaires confondus. */
const perIp = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });
/** Par formulaire : 30 demandes par heure, pour limiter un envoi en masse depuis plusieurs IP. */
const perForm = createRateLimiter({ limit: 30, windowMs: 60 * 60 * 1000 });

const newToken = () => randomBytes(24).toString("base64url");

/** Ce que voit l'administrateur : jamais l'identifiant du document. */
const settingsOf = (form: IntakeForm) => ({
  token: form.token,
  enabled: form.enabled !== false,
  title: form.title,
  intro: form.intro ?? "",
  assigneeId: form.assigneeId,
  status: form.status,
});

/** Projet et membre connecté, s'il est administrateur de l'espace du projet. */
const getAdminAccess = async (db: Db, projectId: string, userId: string) => {
  const project = await db.projects.find(projectId);
  if (!project) return null;
  const member = await getMember({ db, workspaceId: project.workspaceId, userId });
  return member ? { project, member, isAdmin: member.role === MemberRole.ADMIN } : null;
};

const app = new Hono()
  .get("/project/:projectId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const access = await getAdminAccess(db, c.req.param("projectId"), c.get("user").$id);
    if (!access) return c.json({ error: "Unauthorized" }, 401);

    if (!db.intakeForms.enabled) {
      return c.json({ data: { available: false, canManage: false, form: null } });
    }
    // Le jeton est un secret : seuls les administrateurs le voient.
    if (!access.isAdmin) {
      return c.json({ data: { available: true, canManage: false, form: null } });
    }

    const form = await db.intakeForms.first({ where: { projectId: access.project.$id } });
    return c.json({
      data: { available: true, canManage: true, form: form ? settingsOf(form) : null },
    });
  })
  .put(
    "/project/:projectId",
    sessionMiddleware,
    zValidator("json", intakeSettingsSchema),
    async (c) => {
      const db = c.get("db");
      if (!db.intakeForms.enabled) return c.json(NOT_CONFIGURED, 400);

      const access = await getAdminAccess(db, c.req.param("projectId"), c.get("user").$id);
      if (!access) return c.json({ error: "Unauthorized" }, 401);
      if (!access.isAdmin) return c.json({ error: "Réservé aux administrateurs" }, 403);
      const { project } = access;

      const values = c.req.valid("json");
      const assignee = await db.members.find(values.assigneeId);
      if (assignee?.workspaceId !== project.workspaceId) {
        return c.json({ error: "Le membre assigné ne fait pas partie de cet espace" }, 400);
      }
      if (!parseBoardColumns(project.columnConfig).some((column) => column.id === values.status)) {
        return c.json({ error: "Statut introuvable dans ce projet" }, 400);
      }

      const data = {
        title: values.title,
        intro: values.intro || null,
        assigneeId: values.assigneeId,
        status: values.status,
        enabled: values.enabled,
      };
      const existing = await db.intakeForms.first({ where: { projectId: project.$id } });
      const form = existing
        ? await db.intakeForms.update(existing.$id, data)
        : await db.intakeForms.create({
            ...data,
            workspaceId: project.workspaceId,
            projectId: project.$id,
            token: newToken(),
          });

      return c.json({ data: settingsOf(form) });
    },
  )
  /** Nouvelle adresse : l'ancienne cesse aussitôt de fonctionner. */
  .post("/project/:projectId/token", sessionMiddleware, async (c) => {
    const db = c.get("db");
    if (!db.intakeForms.enabled) return c.json(NOT_CONFIGURED, 400);

    const access = await getAdminAccess(db, c.req.param("projectId"), c.get("user").$id);
    if (!access) return c.json({ error: "Unauthorized" }, 401);
    if (!access.isAdmin) return c.json({ error: "Réservé aux administrateurs" }, 403);

    const existing = await db.intakeForms.first({ where: { projectId: access.project.$id } });
    if (!existing) return c.json({ error: "Not found" }, 404);

    const form = await db.intakeForms.update(existing.$id, { token: newToken() });
    return c.json({ data: settingsOf(form) });
  })
  .delete("/project/:projectId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    if (!db.intakeForms.enabled) return c.json(NOT_CONFIGURED, 400);

    const access = await getAdminAccess(db, c.req.param("projectId"), c.get("user").$id);
    if (!access) return c.json({ error: "Unauthorized" }, 401);
    if (!access.isAdmin) return c.json({ error: "Réservé aux administrateurs" }, 403);

    const existing = await db.intakeForms.first({ where: { projectId: access.project.$id } });
    if (existing) await db.intakeForms.delete(existing.$id);
    return c.json({ data: { projectId: access.project.$id } });
  })

  // Routes publiques, sans connexion : uniquement le titre et l'introduction du formulaire.
  .get("/public/:token", async (c) => {
    const found = await getPublicIntakeForm(c.req.param("token"));
    if (!found) return c.json(NOT_FOUND, 404);
    return c.json({ data: { title: found.form.title, intro: found.form.intro ?? "" } });
  })
  .post("/public/:token", zValidator("json", intakeSubmissionSchema), async (c) => {
    const token = c.req.param("token");
    if (!perIp.hit(clientIp(c.req.raw.headers))) {
      return c.json({ error: "Trop de demandes, réessayez dans quelques minutes." }, 429);
    }

    const found = await getPublicIntakeForm(token);
    if (!found) return c.json(NOT_FOUND, 404);
    const { db, form } = found;

    const submission = c.req.valid("json");
    // Champ piège rempli : un robot. Il reçoit la même réponse qu'un envoi réussi.
    if (submission.website) return c.json({ data: { success: true } });

    if (!perForm.hit(form.$id)) {
      return c.json({ error: "Trop de demandes, réessayez dans quelques minutes." }, 429);
    }

    // Le statut a pu être supprimé du tableau depuis : première colonne du projet à la place.
    const project = await db.projects.get(form.projectId);
    const columns = parseBoardColumns(project.columnConfig);
    const status = columns.some((column) => column.id === form.status)
      ? form.status
      : (columns.find((column) => !column.hidden) ?? columns[0]).id;

    const now = new Date();
    const result = await createTask(
      db,
      null,
      {
        name: submission.title,
        status,
        workspaceId: form.workspaceId,
        projectId: form.projectId,
        assigneeId: form.assigneeId,
        priority: TaskPriority.MEDIUM,
        startDate: now,
        dueDate: new Date(now.getTime() + INTAKE_DUE_DAYS * 24 * 60 * 60 * 1000),
        description: buildIntakeDescription(submission),
      },
      { via: INTAKE_VIA },
    );
    if (result.error) {
      console.error("[intake] création impossible :", result.error);
      return c.json({ error: "Impossible d'envoyer la demande pour le moment." }, 503);
    }

    return c.json({ data: { success: true } });
  });

export default app;
