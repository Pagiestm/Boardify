import { z } from "zod";
import { Hono } from "hono";
import { generateText, Output, streamText } from "ai";
import { ID, Query, type Databases } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import { Label } from "@/features/labels/types";
import { Project } from "@/features/projects/types";
import { parseBoardColumns } from "@/features/projects/utils";
import { Task, TaskPriority, TaskStatus } from "@/features/tasks/types";
import { isDoneStatus, getOpenStatus } from "@/features/tasks/server/done";
import { createTask } from "@/features/tasks/server/mutations";
import { listChecklistItems } from "@/features/checklist/server/items";
import { Sprint } from "@/features/sprints/types";

import { createAdminClient } from "@/lib/appwrite";
import { sessionMiddleware } from "@/lib/session-middleware";
import {
  AI_SETTINGS_ID,
  DATABASE_ID,
  LABELS_ID,
  PROJECTS_ID,
  SPRINTS_ID,
  TASKS_ID,
} from "@/config";

import {
  AiProvider,
  assistantSettingsSchema,
  AssistantStatus,
  extractedTaskSchema,
  MAX_SOURCE_TEXT,
  modelsRequestSchema,
  taskDraftRequestSchema,
  taskDraftSchema,
} from "../types";
import { encryptSecret, decryptSecret } from "./crypto";
import {
  AiSettings,
  createModel,
  describeAiError,
  getAiSettings,
  getWorkspaceModel,
  streamTextResponse,
} from "./model";
import { listModels, ModelListError } from "./models";
import insights from "./insights";
import {
  formatDay,
  GENERATE_TIMEOUT_MS,
  getMemberNames,
  NOT_CONFIGURED,
  STREAM_TIMEOUT_MS,
  SYSTEM,
  today,
} from "./shared";

const MAX_SUMMARY_TASKS = 300;

const INSTRUCTIONS = {
  status:
    "Rédige un point d'avancement pour l'équipe, en texte simple (pas de Markdown : ni gras, ni dièses). Sections, chacune sur sa propre ligne terminée par deux-points : « Avancement : » (une ou deux phrases avec les chiffres clés), « Terminé récemment : », « En cours : », « En retard ou à risque : » (avec l'assigné), « Prochaines étapes : ». Sous chaque section, une liste courte avec des tirets « - ». 250 mots maximum, sans inventer de tâche.",
  report:
    "Rédige le bilan des {days} derniers jours, prêt à être envoyé à l'équipe ou à un client, en texte simple (pas de Markdown : ni gras, ni dièses). Sections, chacune sur sa propre ligne terminée par deux-points : « Résumé : » (deux phrases), « Réalisé : », « En cours : », « Points d'attention : ». Listes courtes avec des tirets « - », 250 mots maximum, sans inventer de tâche.",
  release:
    "Rédige des notes de version à partir des tâches terminées sur les {days} derniers jours, pour des utilisateurs non techniques, en texte simple (pas de Markdown : ni gras, ni dièses). Regroupe-les en sections, chacune sur sa propre ligne terminée par deux-points : « Nouveautés : », « Améliorations : », « Corrections : ». Une ligne par changement avec un tiret « - », formulée du point de vue de l'utilisateur. Omets une section vide, 200 mots maximum.",
} as const;

const toStatus = (settings: AiSettings | null, canManage: boolean): AssistantStatus => ({
  configured: Boolean(settings),
  enabled: settings?.enabled !== false,
  canManage,
  provider: settings?.provider ?? null,
  model: settings?.model ?? null,
  baseUrl: settings?.baseUrl ?? null,
  apiKeyHint: settings?.apiKeyHint ?? null,
});

/** Tâche et projet accessibles au membre connecté. */
const getTaskContext = async (databases: Databases, taskId: string, userId: string) => {
  const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);
  const member = await getMember({ databases, workspaceId: task.workspaceId, userId });
  if (!member) return null;

  const [project, labels, checklist] = await Promise.all([
    databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, task.projectId),
    task.labelIds?.length
      ? databases
          .listDocuments<Label>(DATABASE_ID, LABELS_ID, [Query.equal("$id", task.labelIds)])
          .then(({ documents }) => documents)
      : Promise.resolve([] as Label[]),
    listChecklistItems(databases, [task.$id]),
  ]);
  const column = parseBoardColumns(project.columnConfig).find((item) => item.id === task.status);

  const context = [
    `Projet : ${project.name}`,
    `Tâche : ${task.name}`,
    `Statut : ${column?.label ?? task.status}`,
    `Priorité : ${task.priority}`,
    `Période : du ${formatDay(task.startDate)} au ${formatDay(task.dueDate)}`,
    labels.length ? `Étiquettes : ${labels.map((label) => label.name).join(", ")}` : null,
    task.description?.trim() ? `Description actuelle :\n${task.description.trim()}` : null,
    checklist.length
      ? `Sous-tâches existantes :\n${checklist.map((item) => `- ${item.title}`).join("\n")}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  return { task, member, context, checklist };
};

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const { workspaceId } = c.req.valid("query");
      const member = await getMember({
        databases: c.get("databases"),
        workspaceId,
        userId: c.get("user").$id,
      });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      const settings = await getAiSettings(workspaceId);
      return c.json({ data: toStatus(settings, member.role === MemberRole.ADMIN) });
    },
  )
  .put("/", sessionMiddleware, zValidator("json", assistantSettingsSchema), async (c) => {
    const values = c.req.valid("json");
    const member = await getMember({
      databases: c.get("databases"),
      workspaceId: values.workspaceId,
      userId: c.get("user").$id,
    });
    if (member?.role !== MemberRole.ADMIN) {
      return c.json({ error: "Réservé aux administrateurs" }, 403);
    }

    const existing = await getAiSettings(values.workspaceId);
    if (!values.apiKey && (!existing || existing.provider !== values.provider)) {
      return c.json({ error: "Collez la clé d'API de ce fournisseur" }, 400);
    }

    const data = {
      workspaceId: values.workspaceId,
      provider: values.provider,
      model: values.model,
      baseUrl: values.provider === AiProvider.OPENAI_COMPATIBLE ? (values.baseUrl ?? null) : null,
      enabled: values.enabled ?? true,
      updatedBy: member.$id,
    };
    const key = values.apiKey
      ? { apiKeyEncrypted: encryptSecret(values.apiKey), apiKeyHint: values.apiKey.slice(-4) }
      : null;

    const { databases } = await createAdminClient();
    const settings = existing
      ? await databases.updateDocument<AiSettings>(DATABASE_ID, AI_SETTINGS_ID, existing.$id, {
          ...data,
          ...key,
        })
      : await databases.createDocument<AiSettings>(DATABASE_ID, AI_SETTINGS_ID, ID.unique(), {
          ...data,
          apiKeyEncrypted: key!.apiKeyEncrypted,
          apiKeyHint: key!.apiKeyHint,
        });

    return c.json({ data: toStatus(settings, true) });
  })
  .delete(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ workspaceId: z.string() })),
    async (c) => {
      const { workspaceId } = c.req.valid("query");
      const member = await getMember({
        databases: c.get("databases"),
        workspaceId,
        userId: c.get("user").$id,
      });
      if (member?.role !== MemberRole.ADMIN) {
        return c.json({ error: "Réservé aux administrateurs" }, 403);
      }

      const existing = await getAiSettings(workspaceId);
      if (existing) {
        const { databases } = await createAdminClient();
        await databases.deleteDocument(DATABASE_ID, AI_SETTINGS_ID, existing.$id);
      }
      return c.json({ data: toStatus(null, true) });
    },
  )
  .post("/models", sessionMiddleware, zValidator("json", modelsRequestSchema), async (c) => {
    const values = c.req.valid("json");
    const member = await getMember({
      databases: c.get("databases"),
      workspaceId: values.workspaceId,
      userId: c.get("user").$id,
    });
    if (member?.role !== MemberRole.ADMIN) {
      return c.json({ error: "Réservé aux administrateurs" }, 403);
    }

    const existing = await getAiSettings(values.workspaceId);
    const apiKey =
      values.apiKey ||
      (existing?.provider === values.provider
        ? decryptSecret(existing.apiKeyEncrypted)
        : undefined);
    if (!apiKey) return c.json({ error: "Collez la clé d'API" }, 400);

    try {
      const models = await listModels({ ...values, apiKey });
      return c.json({ data: models });
    } catch (error) {
      if (error instanceof ModelListError) return c.json({ error: error.message }, 400);
      console.error("Liste des modèles", error);
      return c.json({ error: "Impossible de récupérer les modèles de ce fournisseur." }, 400);
    }
  })
  .post("/test", sessionMiddleware, zValidator("json", assistantSettingsSchema), async (c) => {
    const values = c.req.valid("json");
    const member = await getMember({
      databases: c.get("databases"),
      workspaceId: values.workspaceId,
      userId: c.get("user").$id,
    });
    if (member?.role !== MemberRole.ADMIN) {
      return c.json({ error: "Réservé aux administrateurs" }, 403);
    }

    const existing = await getAiSettings(values.workspaceId);
    const apiKey =
      values.apiKey ||
      (existing?.provider === values.provider
        ? decryptSecret(existing.apiKeyEncrypted)
        : undefined);
    if (!apiKey) return c.json({ error: "Collez la clé d'API" }, 400);

    try {
      const { text } = await generateText({
        model: createModel({ ...values, apiKey }),
        prompt: "Réponds seulement par le mot : OK",
        maxRetries: 0,
        abortSignal: AbortSignal.timeout(30_000),
      });
      return c.json({ data: { ok: true, reply: text.trim().slice(0, 50) } });
    } catch (error) {
      console.error("Test de l'assistant IA", error);
      return c.json({ data: { ok: false, error: describeAiError(error) } });
    }
  })
  .post("/draft", sessionMiddleware, zValidator("json", taskDraftRequestSchema), async (c) => {
    const databases = c.get("databases");
    const { workspaceId, projectId, name, description } = c.req.valid("json");
    const member = await getMember({ databases, workspaceId, userId: c.get("user").$id });
    if (!member) return c.json({ error: "Unauthorized" }, 401);

    const model = await getWorkspaceModel(workspaceId);
    if (!model) return c.json(NOT_CONFIGURED, 400);

    const project = projectId
      ? await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId).catch(() => null)
      : null;

    try {
      const { output } = await generateText({
        model,
        system: SYSTEM,
        output: Output.object({ schema: taskDraftSchema }),
        prompt: [
          project?.workspaceId === workspaceId ? `Projet : ${project.name}` : null,
          `Nouvelle tâche : ${name}`,
          description?.trim() ? `Notes de l'utilisateur :\n${description.trim()}` : null,
          "",
          "Prépare cette tâche : rédige sa description (en reprenant les notes si elles existent), propose ses sous-tâches, sa priorité et son estimation.",
        ]
          .filter((line) => line !== null)
          .join("\n"),
        maxRetries: 1,
        abortSignal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
      });

      const allowedPoints = [1, 2, 3, 5, 8, 13];
      return c.json({
        data: {
          // Certains modèles renvoient une liste à tirets sur une seule ligne.
          description: output.description.includes("\n")
            ? output.description.trim()
            : output.description.trim().replace(/\s+-\s+(?=\S)/g, "\n- "),
          checklist: [
            ...new Set(output.checklist.map((item) => item.trim().slice(0, 500)).filter(Boolean)),
          ].slice(0, 8),
          priority: output.priority as TaskPriority,
          estimate: allowedPoints.reduce((closest, points) =>
            Math.abs(points - output.estimate) < Math.abs(closest - output.estimate)
              ? points
              : closest,
          ),
        },
      });
    } catch (error) {
      console.error("Assistant IA", error);
      return c.json({ error: describeAiError(error) }, 400);
    }
  })
  .post(
    "/tasks/:taskId/description",
    sessionMiddleware,
    zValidator("json", z.object({ instructions: z.string().trim().max(500).optional() })),
    async (c) => {
      const { instructions } = c.req.valid("json");
      const found = await getTaskContext(
        c.get("databases"),
        c.req.param("taskId"),
        c.get("user").$id,
      );
      if (!found) return c.json({ error: "Unauthorized" }, 401);

      const model = await getWorkspaceModel(found.task.workspaceId);
      if (!model) return c.json(NOT_CONFIGURED, 400);

      const result = streamText({
        model,
        system: SYSTEM,
        prompt: `${found.context}

${found.task.description?.trim() ? "Améliore et complète la description actuelle" : "Rédige la description de cette tâche"} en texte simple (pas de Markdown : ni gras, ni titres, ni dièses) : l'objectif en une ou deux phrases, une ligne vide, les points à traiter en liste avec des tirets « - », une ligne vide, puis « Terminé quand : » suivi des critères. Pas de phrase d'introduction ni de conclusion, 150 mots maximum.${
          instructions ? `\nConsigne de l'utilisateur : ${instructions}` : ""
        }`,
        maxRetries: 1,
        abortSignal: AbortSignal.any([c.req.raw.signal, AbortSignal.timeout(STREAM_TIMEOUT_MS)]),
      });

      return streamTextResponse(result);
    },
  )
  .post("/tasks/:taskId/subtasks", sessionMiddleware, async (c) => {
    const found = await getTaskContext(
      c.get("databases"),
      c.req.param("taskId"),
      c.get("user").$id,
    );
    if (!found) return c.json({ error: "Unauthorized" }, 401);

    const model = await getWorkspaceModel(found.task.workspaceId);
    if (!model) return c.json(NOT_CONFIGURED, 400);

    try {
      const { output } = await generateText({
        model,
        system: SYSTEM,
        output: Output.object({
          schema: z.object({
            items: z
              .array(
                z.string().describe("Sous-tâche courte et actionnable, commençant par un verbe"),
              )
              .describe("Entre 3 et 8 sous-tâches, dans l'ordre de réalisation"),
          }),
        }),
        prompt: `${found.context}

Découpe cette tâche en sous-tâches concrètes, sans reprendre les sous-tâches existantes.`,
        maxRetries: 1,
        abortSignal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
      });

      const existing = new Set(found.checklist.map((item) => item.title.trim().toLowerCase()));
      const items = [
        ...new Set(
          output.items
            .map((item) => item.trim().slice(0, 500))
            .filter((item) => item && !existing.has(item.toLowerCase())),
        ),
      ].slice(0, 10);

      return c.json({ data: { items } });
    } catch (error) {
      console.error("Assistant IA", error);
      return c.json({ error: describeAiError(error) }, 400);
    }
  })
  .post(
    "/projects/:projectId/extract",
    sessionMiddleware,
    zValidator("json", z.object({ text: z.string().trim().min(10).max(MAX_SOURCE_TEXT) })),
    async (c) => {
      const databases = c.get("databases");
      const { text } = c.req.valid("json");
      const project = await databases.getDocument<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        c.req.param("projectId"),
      );
      const member = await getMember({
        databases,
        workspaceId: project.workspaceId,
        userId: c.get("user").$id,
      });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      const model = await getWorkspaceModel(project.workspaceId);
      if (!model) return c.json(NOT_CONFIGURED, 400);

      const names = await getMemberNames(databases, project.workspaceId);
      const idByName = new Map([...names].map(([id, name]) => [name.toLowerCase(), id]));

      try {
        const { output } = await generateText({
          model,
          system: SYSTEM,
          output: Output.object({
            schema: z.object({
              tasks: z.array(extractedTaskSchema).describe("Tâches à créer, 30 au maximum"),
            }),
          }),
          prompt: `Nous sommes le ${today()}. Projet : ${project.name}.
Membres de l'espace : ${[...names.values()].join(", ")}.

Extrais du texte ci-dessous les actions à réaliser, une tâche par action. Ignore ce qui est déjà fait ou purement informatif. Convertis les dates relatives (« vendredi », « dans 2 semaines ») en dates absolues.

Texte :
"""
${text}
"""`,
          maxRetries: 1,
          abortSignal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
        });

        const tasks = output.tasks.slice(0, 30).map((task) => ({
          name: task.name.trim().slice(0, 256),
          description: task.description?.trim() || null,
          dueDate: task.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(task.dueDate) ? task.dueDate : null,
          priority: task.priority as TaskPriority,
          assigneeId: (task.assignee && idByName.get(task.assignee.toLowerCase())) || member.$id,
        }));

        return c.json({ data: { tasks } });
      } catch (error) {
        console.error("Assistant IA", error);
        return c.json({ error: describeAiError(error) }, 400);
      }
    },
  )
  .post(
    "/projects/:projectId/tasks",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        tasks: z
          .array(
            z.object({
              name: z.string().trim().min(1).max(256),
              description: z.string().max(10000).nullable(),
              dueDate: z.coerce.date(),
              startDate: z.coerce.date(),
              priority: z.nativeEnum(TaskPriority),
              assigneeId: z.string().min(1),
            }),
          )
          .min(1)
          .max(30),
      }),
    ),
    async (c) => {
      const databases = c.get("databases");
      const { tasks } = c.req.valid("json");
      const project = await databases.getDocument<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        c.req.param("projectId"),
      );
      const member = await getMember({
        databases,
        workspaceId: project.workspaceId,
        userId: c.get("user").$id,
      });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      // « À faire » si la colonne existe, sinon la première colonne ouverte.
      const todo = parseBoardColumns(project.columnConfig).find(
        (column) => column.id === TaskStatus.TODO && !column.done && !column.hidden,
      );
      const status = todo?.id ?? getOpenStatus(project);
      const created: string[] = [];
      const failures: { name: string; error: string }[] = [];

      for (const task of tasks) {
        const result = await createTask(
          databases,
          member.$id,
          {
            name: task.name,
            description: task.description ?? undefined,
            dueDate: task.dueDate,
            startDate: task.startDate > task.dueDate ? task.dueDate : task.startDate,
            priority: task.priority,
            assigneeId: task.assigneeId,
            status,
            workspaceId: project.workspaceId,
            projectId: project.$id,
          },
          { via: "assistant" },
        );
        if (result.error !== undefined) failures.push({ name: task.name, error: result.error });
        else created.push(result.data.$id);
      }

      return c.json({ data: { created: created.length, failures } });
    },
  )
  .post(
    "/projects/:projectId/summary",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        sprintId: z.string().nullable().optional(),
        mode: z.enum(["status", "report", "release"]).default("status"),
        days: z.number().int().min(1).max(90).default(7),
      }),
    ),
    async (c) => {
      const databases = c.get("databases");
      const { sprintId, mode, days } = c.req.valid("json");
      const project = await databases.getDocument<Project>(
        DATABASE_ID,
        PROJECTS_ID,
        c.req.param("projectId"),
      );
      const member = await getMember({
        databases,
        workspaceId: project.workspaceId,
        userId: c.get("user").$id,
      });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      const model = await getWorkspaceModel(project.workspaceId);
      if (!model) return c.json(NOT_CONFIGURED, 400);

      const sprint =
        sprintId && SPRINTS_ID
          ? await databases.getDocument<Sprint>(DATABASE_ID, SPRINTS_ID, sprintId).catch(() => null)
          : null;

      const [{ documents: tasks }, names] = await Promise.all([
        databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
          Query.equal("projectId", project.$id),
          ...(sprint ? [Query.equal("sprintId", sprint.$id)] : []),
          Query.orderDesc("$updatedAt"),
          Query.limit(MAX_SUMMARY_TASKS),
        ]),
        getMemberNames(databases, project.workspaceId),
      ]);
      const now = today();
      const since = formatDay(new Date(Date.now() - days * 864e5).toISOString());
      // Bilan et notes de version : uniquement l'activité de la période.
      const relevant =
        mode === "status"
          ? tasks
          : tasks.filter(
              (task) =>
                formatDay(task.$updatedAt) >= since &&
                (mode === "report" || isDoneStatus(project, task.status)),
            );
      if (relevant.length === 0) {
        return c.json(
          {
            error:
              mode === "status"
                ? "Aucune tâche à résumer."
                : `Aucune tâche ${mode === "release" ? "terminée" : "modifiée"} sur les ${days} derniers jours.`,
          },
          400,
        );
      }

      const columns = parseBoardColumns(project.columnConfig);
      const lines = relevant.map((task) => {
        const done = isDoneStatus(project, task.status);
        const due = formatDay(task.dueDate);
        const late = !done && due < now;
        return `- ${task.name} | ${columns.find((column) => column.id === task.status)?.label ?? task.status}${done ? " (terminée)" : ""} | ${names.get(task.assigneeId) ?? "?"} | échéance ${due}${late ? " (EN RETARD)" : ""} | priorité ${task.priority} | modifiée le ${formatDay(task.$updatedAt)}${task.estimate != null ? ` | ${task.estimate} pts` : ""}`;
      });

      const result = streamText({
        model,
        system: SYSTEM,
        prompt: `Nous sommes le ${now}. ${
          sprint
            ? `Sprint « ${sprint.name} » du projet ${project.name}, du ${formatDay(sprint.startDate)} au ${formatDay(sprint.endDate)}${sprint.goal ? `, objectif : ${sprint.goal}` : ""}.`
            : `Projet ${project.name}.`
        }

Tâches (titre | statut | assigné | échéance | priorité | dernière modification) :
${lines.join("\n")}

${INSTRUCTIONS[mode].replace("{days}", String(days))}`,
        maxRetries: 1,
        abortSignal: AbortSignal.any([c.req.raw.signal, AbortSignal.timeout(STREAM_TIMEOUT_MS)]),
      });

      return streamTextResponse(result);
    },
  )
  .route("/", insights);

export default app;
