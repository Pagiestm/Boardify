import { z } from "zod";
import { Hono } from "hono";
import { generateText, Output, streamText } from "ai";
import { Query, type Databases } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";
import { Label } from "@/features/labels/types";
import { Project } from "@/features/projects/types";
import { parseBoardColumns } from "@/features/projects/utils";
import { Sprint } from "@/features/sprints/types";
import { Comment } from "@/features/comments/types";
import { replaceMentions } from "@/features/comments/mentions";
import { Task, TaskPriority } from "@/features/tasks/types";
import { isDoneStatus } from "@/features/tasks/server/done";

import { sessionMiddleware } from "@/lib/session-middleware";
import { COMMENTS_ID, DATABASE_ID, LABELS_ID, PROJECTS_ID, SPRINTS_ID, TASKS_ID } from "@/config";

import { describeAiError, getWorkspaceModel, streamTextResponse } from "./model";
import {
  formatDay,
  GENERATE_TIMEOUT_MS,
  getMemberNames,
  NOT_CONFIGURED,
  STREAM_TIMEOUT_MS,
  SYSTEM,
  today,
} from "./shared";

const MAX_CONTEXT_TASKS = 400;
const POINTS = [1, 2, 3, 5, 8, 13];

const closestPoints = (value: number) =>
  POINTS.reduce((closest, points) =>
    Math.abs(points - value) < Math.abs(closest - value) ? points : closest,
  );

const priorityLabel: Record<string, string> = { HIGH: "haute", MEDIUM: "moyenne", LOW: "basse" };

interface TaskContext {
  tasks: Task[];
  projects: Map<string, Project>;
  names: Map<string, string>;
}

/** Tâches, projets et noms des membres d'un espace (ou d'un projet). */
const loadContext = async (
  databases: Databases,
  workspaceId: string,
  filters: string[] = [],
): Promise<TaskContext> => {
  const [{ documents: tasks }, { documents: projects }, names] = await Promise.all([
    databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal("workspaceId", workspaceId),
      ...filters,
      Query.orderDesc("$updatedAt"),
      Query.limit(MAX_CONTEXT_TASKS),
    ]),
    databases.listDocuments<Project>(DATABASE_ID, PROJECTS_ID, [
      Query.equal("workspaceId", workspaceId),
      Query.limit(100),
    ]),
    getMemberNames(databases, workspaceId),
  ]);
  return { tasks, projects: new Map(projects.map((project) => [project.$id, project])), names };
};

const isDone = (context: TaskContext, task: Task) =>
  isDoneStatus(context.projects.get(task.projectId), task.status);

const statusLabel = (context: TaskContext, task: Task) =>
  parseBoardColumns(context.projects.get(task.projectId)?.columnConfig).find(
    (column) => column.id === task.status,
  )?.label ?? task.status;

/** Ligne de contexte compacte pour le modèle : identifiant entre crochets en tête. */
const describeTask = (context: TaskContext, task: Task) => {
  const now = today();
  const due = formatDay(task.dueDate);
  const done = isDone(context, task);
  return [
    `[${task.$id}] ${task.name}`,
    context.projects.get(task.projectId)?.name ?? "?",
    `${statusLabel(context, task)}${done ? " (terminée)" : ""}`,
    `assignée à ${context.names.get(task.assigneeId) ?? "?"}`,
    `échéance ${due}${!done && due < now ? " (EN RETARD)" : ""}`,
    `priorité ${priorityLabel[task.priority] ?? task.priority}`,
    task.estimate != null ? `${task.estimate} pts` : null,
    task.blockedBy?.length ? `bloquée par ${task.blockedBy.length} tâche(s)` : null,
  ]
    .filter(Boolean)
    .join(" | ");
};

const publicTask = (context: TaskContext, task: Task) => {
  const done = isDone(context, task);
  return {
    id: task.$id,
    name: task.name,
    projectName: context.projects.get(task.projectId)?.name ?? null,
    status: statusLabel(context, task),
    done,
    dueDate: task.dueDate,
    overdue: !done && formatDay(task.dueDate) < today(),
    priority: task.priority,
    assigneeName: context.names.get(task.assigneeId) ?? null,
  };
};

const workspaceParam = z.object({ workspaceId: z.string() });

/**
 * Retrouve une tâche à partir de l'identifiant renvoyé par le modèle : les modèles le
 * recopient parfois avec ses crochets, ou donnent le titre à la place.
 */
const findTask = (tasks: Task[], raw: string) => {
  const key = raw
    .trim()
    .replace(/^\[|\]$/g, "")
    .trim();
  return (
    tasks.find((task) => task.$id === key) ??
    tasks.find((task) => key.includes(task.$id)) ??
    tasks.find((task) => task.name.toLowerCase() === key.toLowerCase())
  );
};

/** Associe les éléments du modèle à leurs tâches, sans doublon. */
const matchTasks = <T extends { taskId: string }>(tasks: Task[], items: T[]) => {
  const seen = new Set<string>();
  return items.flatMap((item) => {
    const task = findTask(tasks, item.taskId);
    if (!task || seen.has(task.$id)) return [];
    seen.add(task.$id);
    return [{ item, task }];
  });
};

const app = new Hono()
  /** Ma journée : les tâches à traiter aujourd'hui, avec une raison pour chacune. */
  .post(
    "/workspaces/:workspaceId/focus",
    sessionMiddleware,
    zValidator("param", workspaceParam),
    async (c) => {
      const databases = c.get("databases");
      const { workspaceId } = c.req.valid("param");
      const member = await getMember({ databases, workspaceId, userId: c.get("user").$id });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      const model = await getWorkspaceModel(workspaceId);
      if (!model) return c.json(NOT_CONFIGURED, 400);

      const context = await loadContext(databases, workspaceId, [
        Query.equal("assigneeId", member.$id),
      ]);
      const open = context.tasks.filter((task) => !isDone(context, task));
      if (open.length === 0) {
        return c.json({
          data: { intro: "Aucune tâche ouverte ne vous est assignée. Belle journée !", items: [] },
        });
      }

      try {
        const { output } = await generateText({
          model,
          system: SYSTEM,
          output: Output.object({
            schema: z.object({
              intro: z.string().describe("Une phrase d'introduction motivante et concrète"),
              items: z
                .array(
                  z.object({
                    taskId: z.string().describe("Identifiant exact entre crochets"),
                    reason: z
                      .string()
                      .describe("Pourquoi la traiter aujourd'hui, en une phrase courte"),
                  }),
                )
                .describe("Entre 1 et 5 tâches, de la plus importante à la moins importante"),
            }),
          }),
          prompt: `Nous sommes le ${today()}. Voici les tâches ouvertes de ${context.names.get(member.$id) ?? "l'utilisateur"} :
${open
  .slice(0, 150)
  .map((task) => `- ${describeTask(context, task)}`)
  .join("\n")}

Choisis les tâches à traiter en priorité aujourd'hui : d'abord les retards et les échéances proches, puis la priorité haute, puis ce qui débloque d'autres tâches.`,
          maxRetries: 1,
          abortSignal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
        });

        const items = matchTasks(open, output.items)
          .slice(0, 5)
          .map(({ item, task }) => ({ ...publicTask(context, task), reason: item.reason }));

        return c.json({ data: { intro: output.intro, items } });
      } catch (error) {
        console.error("Assistant IA", error);
        return c.json({ error: describeAiError(error) }, 400);
      }
    },
  )
  /** Recherche en langage naturel : la question devient des critères, appliqués côté serveur. */
  .post(
    "/workspaces/:workspaceId/search",
    sessionMiddleware,
    zValidator("param", workspaceParam),
    zValidator("json", z.object({ query: z.string().trim().min(2).max(300) })),
    async (c) => {
      const databases = c.get("databases");
      const { workspaceId } = c.req.valid("param");
      const { query } = c.req.valid("json");
      const member = await getMember({ databases, workspaceId, userId: c.get("user").$id });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      const model = await getWorkspaceModel(workspaceId);
      if (!model) return c.json(NOT_CONFIGURED, 400);

      const [context, { documents: labels }] = await Promise.all([
        loadContext(databases, workspaceId),
        databases.listDocuments<Label>(DATABASE_ID, LABELS_ID, [
          Query.equal("workspaceId", workspaceId),
          Query.limit(100),
        ]),
      ]);

      try {
        const { output } = await generateText({
          model,
          system: SYSTEM,
          output: Output.object({
            schema: z.object({
              summary: z
                .string()
                .describe("Reformulation courte de la recherche, ex. « Vos tâches en retard »"),
              projectIds: z.array(z.string()).describe("Projets visés, vide pour tous"),
              assigneeIds: z.array(z.string()).describe("Membres visés, vide pour tous"),
              state: z.enum(["open", "done", "all"]).describe("open par défaut"),
              overdue: z.boolean().describe("Uniquement les tâches en retard"),
              dueWithinDays: z
                .number()
                .int()
                .nullable()
                .describe(
                  "Échéance dans les N prochains jours (7 pour « cette semaine »), sinon null",
                ),
              priority: z.enum(["HIGH", "MEDIUM", "LOW"]).nullable(),
              labelIds: z.array(z.string()).describe("Étiquettes visées, vide pour toutes"),
              blocked: z.boolean().describe("Uniquement les tâches bloquées par d'autres"),
              keywords: z
                .string()
                .nullable()
                .describe("Mots à chercher dans le titre ou la description, sinon null"),
            }),
          }),
          prompt: `Nous sommes le ${today()}. L'utilisateur s'appelle ${context.names.get(member.$id)} (identifiant ${member.$id}) : « moi », « mes » le désignent.
Projets : ${[...context.projects.values()].map((project) => `${project.name} [${project.$id}]`).join(", ") || "aucun"}
Membres : ${[...context.names].map(([id, name]) => `${name} [${id}]`).join(", ")}
Étiquettes : ${labels.map((label) => `${label.name} [${label.$id}]`).join(", ") || "aucune"}

Traduis cette recherche en critères, avec les identifiants entre crochets : « ${query} »`,
          maxRetries: 1,
          abortSignal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
        });

        const now = today();
        const limit =
          output.dueWithinDays != null
            ? formatDay(new Date(Date.now() + output.dueWithinDays * 864e5).toISOString())
            : null;
        const keywords = output.keywords?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];

        const tasks = context.tasks.filter((task) => {
          const done = isDone(context, task);
          const due = formatDay(task.dueDate);
          if (output.projectIds.length && !output.projectIds.includes(task.projectId)) return false;
          if (output.assigneeIds.length && !output.assigneeIds.includes(task.assigneeId))
            return false;
          if (output.state === "open" && done) return false;
          if (output.state === "done" && !done) return false;
          if (output.overdue && (done || due >= now)) return false;
          if (limit && (due < now || due > limit)) return false;
          if (output.priority && task.priority !== output.priority) return false;
          if (
            output.labelIds.length &&
            !output.labelIds.some((id) => task.labelIds?.includes(id))
          ) {
            return false;
          }
          if (output.blocked && !task.blockedBy?.length) return false;
          const haystack = `${task.name} ${task.description ?? ""}`.toLowerCase();
          return keywords.every((word) => haystack.includes(word));
        });

        return c.json({
          data: {
            summary: output.summary,
            total: tasks.length,
            tasks: tasks
              .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
              .slice(0, 20)
              .map((task) => publicTask(context, task)),
          },
        });
      } catch (error) {
        console.error("Assistant IA", error);
        return c.json({ error: describeAiError(error) }, 400);
      }
    },
  )
  /** Ajout rapide : « Appeler Marie demain, urgent #commercial » devient des champs. */
  .post(
    "/workspaces/:workspaceId/parse",
    sessionMiddleware,
    zValidator("param", workspaceParam),
    zValidator("json", z.object({ text: z.string().trim().min(3).max(500) })),
    async (c) => {
      const databases = c.get("databases");
      const { workspaceId } = c.req.valid("param");
      const { text } = c.req.valid("json");
      const member = await getMember({ databases, workspaceId, userId: c.get("user").$id });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      const model = await getWorkspaceModel(workspaceId);
      if (!model) return c.json(NOT_CONFIGURED, 400);

      const [{ documents: projects }, names, { documents: labels }] = await Promise.all([
        databases.listDocuments<Project>(DATABASE_ID, PROJECTS_ID, [
          Query.equal("workspaceId", workspaceId),
          Query.limit(100),
        ]),
        getMemberNames(databases, workspaceId),
        databases.listDocuments<Label>(DATABASE_ID, LABELS_ID, [
          Query.equal("workspaceId", workspaceId),
          Query.limit(100),
        ]),
      ]);

      try {
        const { output } = await generateText({
          model,
          system: SYSTEM,
          output: Output.object({
            schema: z.object({
              name: z
                .string()
                .describe(
                  "Titre de la tâche, sans la date, la priorité, la personne ni les étiquettes",
                ),
              dueDate: z
                .string()
                .nullable()
                .describe("Échéance AAAA-MM-JJ si indiquée, sinon null"),
              priority: z
                .enum(["HIGH", "MEDIUM", "LOW"])
                .nullable()
                .describe("Si indiquée (urgent → HIGH)"),
              projectId: z.string().nullable().describe("Projet cité, sinon null"),
              assigneeId: z
                .string()
                .nullable()
                .describe("Membre cité (souvent avec @), sinon null"),
              labelIds: z.array(z.string()).describe("Étiquettes citées (souvent avec #)"),
            }),
          }),
          prompt: `Nous sommes le ${today()} (${new Intl.DateTimeFormat("fr-FR", { weekday: "long", timeZone: "Europe/Paris" }).format(new Date())}).
Projets : ${projects.map((project) => `${project.name} [${project.$id}]`).join(", ") || "aucun"}
Membres : ${[...names].map(([id, name]) => `${name} [${id}]`).join(", ")}
Étiquettes : ${labels.map((label) => `${label.name} [${label.$id}]`).join(", ") || "aucune"}

Analyse cette saisie rapide de tâche et extrais ses champs, avec les identifiants entre crochets : « ${text} »`,
          maxRetries: 1,
          abortSignal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
        });

        return c.json({
          data: {
            name: output.name.trim().slice(0, 256) || text,
            dueDate:
              output.dueDate && /^\d{4}-\d{2}-\d{2}$/.test(output.dueDate) ? output.dueDate : null,
            priority: (output.priority as TaskPriority | null) ?? null,
            projectId: projects.some((project) => project.$id === output.projectId)
              ? output.projectId
              : null,
            assigneeId:
              output.assigneeId && names.has(output.assigneeId) ? output.assigneeId : null,
            labelIds: output.labelIds.filter((id) => labels.some((label) => label.$id === id)),
          },
        });
      } catch (error) {
        console.error("Assistant IA", error);
        return c.json({ error: describeAiError(error) }, 400);
      }
    },
  )
  /** Estimation en masse des tâches ouvertes sans estimation d'un projet. */
  .post("/projects/:projectId/estimate", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
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

    const context = await loadContext(databases, project.workspaceId, [
      Query.equal("projectId", project.$id),
    ]);
    const estimated = context.tasks.filter((task) => task.estimate != null).slice(0, 30);
    const pending = context.tasks
      .filter((task) => task.estimate == null && !isDone(context, task))
      .slice(0, 40);
    if (pending.length === 0) return c.json({ data: { suggestions: [] } });

    try {
      const { output } = await generateText({
        model,
        system: SYSTEM,
        output: Output.object({
          schema: z.object({
            estimates: z.array(
              z.object({
                taskId: z.string(),
                estimate: z.number().int().describe("Points parmi 1, 2, 3, 5, 8, 13"),
              }),
            ),
          }),
        }),
        prompt: `Projet ${project.name}. Estime l'effort de chaque tâche en points (1, 2, 3, 5, 8 ou 13), de façon cohérente avec les tâches déjà estimées.

Tâches déjà estimées (référence) :
${estimated.map((task) => `- ${task.name} : ${task.estimate} pts`).join("\n") || "aucune"}

Tâches à estimer :
${pending.map((task) => `- [${task.$id}] ${task.name}${task.description ? ` — ${task.description.slice(0, 200).replace(/\s+/g, " ")}` : ""}`).join("\n")}`,
        maxRetries: 1,
        abortSignal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
      });

      const suggestions = matchTasks(pending, output.estimates).map(({ item, task }) => ({
        taskId: task.$id,
        name: task.name,
        estimate: closestPoints(item.estimate),
      }));
      return c.json({ data: { suggestions } });
    } catch (error) {
      console.error("Assistant IA", error);
      return c.json({ error: describeAiError(error) }, 400);
    }
  })
  /** Planification : tâches du backlog à ajouter au sprint selon la capacité. */
  .post("/sprints/:sprintId/plan", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    if (!SPRINTS_ID) return c.json({ error: "Sprints non configurés" }, 400);
    const sprint = await databases.getDocument<Sprint>(
      DATABASE_ID,
      SPRINTS_ID,
      c.req.param("sprintId"),
    );
    const member = await getMember({
      databases,
      workspaceId: sprint.workspaceId,
      userId: c.get("user").$id,
    });
    if (!member) return c.json({ error: "Unauthorized" }, 401);

    const model = await getWorkspaceModel(sprint.workspaceId);
    if (!model) return c.json(NOT_CONFIGURED, 400);

    const context = await loadContext(databases, sprint.workspaceId, [
      Query.equal("projectId", sprint.projectId),
    ]);
    const inSprint = context.tasks.filter((task) => task.sprintId === sprint.$id);
    const backlog = context.tasks
      .filter((task) => !task.sprintId && !isDone(context, task))
      .slice(0, 80);
    if (backlog.length === 0)
      return c.json({ data: { summary: "Le backlog est vide.", suggestions: [] } });

    const load = new Map<string, number>();
    for (const task of inSprint) {
      load.set(task.assigneeId, (load.get(task.assigneeId) ?? 0) + (task.estimate ?? 0));
    }

    try {
      const { output } = await generateText({
        model,
        system: SYSTEM,
        output: Output.object({
          schema: z.object({
            summary: z.string().describe("Une ou deux phrases sur l'équilibre proposé"),
            suggestions: z.array(
              z.object({
                taskId: z.string(),
                reason: z.string().describe("Pourquoi l'inclure, en une phrase courte"),
              }),
            ),
          }),
        }),
        prompt: `Nous sommes le ${today()}. Sprint « ${sprint.name} » du ${formatDay(sprint.startDate)} au ${formatDay(sprint.endDate)}${sprint.goal ? `, objectif : ${sprint.goal}` : ""}.

Déjà dans le sprint :
${inSprint.map((task) => `- ${describeTask(context, task)}`).join("\n") || "aucune tâche"}

Charge actuelle par membre (points) : ${[...context.names].map(([id, name]) => `${name} ${load.get(id) ?? 0}`).join(", ")}

Backlog :
${backlog.map((task) => `- ${describeTask(context, task)}`).join("\n")}

Propose les tâches du backlog à ajouter au sprint : celles qui servent l'objectif, les échéances proches et les priorités hautes, en équilibrant la charge (environ 10 à 15 points par personne et par période de deux semaines). Utilise les identifiants entre crochets.`,
        maxRetries: 1,
        abortSignal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
      });

      const suggestions = matchTasks(backlog, output.suggestions)
        .slice(0, 20)
        .map(({ item, task }) => ({
          ...publicTask(context, task),
          estimate: task.estimate ?? null,
          reason: item.reason,
        }));
      return c.json({ data: { summary: output.summary, suggestions } });
    } catch (error) {
      console.error("Assistant IA", error);
      return c.json({ error: describeAiError(error) }, 400);
    }
  })
  /** Discussion d'une tâche : résumé en flux, ou proposition de réponse. */
  .post(
    "/tasks/:taskId/discussion",
    sessionMiddleware,
    zValidator(
      "json",
      z.object({
        mode: z.enum(["summary", "reply"]),
        instructions: z.string().trim().max(500).optional(),
      }),
    ),
    async (c) => {
      const databases = c.get("databases");
      const { mode, instructions } = c.req.valid("json");
      const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, c.req.param("taskId"));
      const member = await getMember({
        databases,
        workspaceId: task.workspaceId,
        userId: c.get("user").$id,
      });
      if (!member) return c.json({ error: "Unauthorized" }, 401);

      const model = await getWorkspaceModel(task.workspaceId);
      if (!model) return c.json(NOT_CONFIGURED, 400);

      const [{ documents: comments }, names] = await Promise.all([
        databases.listDocuments<Comment>(DATABASE_ID, COMMENTS_ID, [
          Query.equal("taskId", task.$id),
          Query.orderAsc("$createdAt"),
          Query.limit(200),
        ]),
        getMemberNames(databases, task.workspaceId),
      ]);
      if (comments.length === 0)
        return c.json({ error: "Aucun commentaire sur cette tâche." }, 400);

      const thread = comments
        .map(
          (comment) =>
            `${names.get(comment.memberId) ?? "Quelqu'un"} (${formatDay(comment.$createdAt)}) : ${replaceMentions(comment.content, (name) => `@${name}`)}`,
        )
        .join("\n");
      const header = `Tâche : ${task.name}${task.description ? `\nDescription : ${task.description.slice(0, 1000)}` : ""}\n\nDiscussion :\n${thread}`;

      if (mode === "summary") {
        const result = streamText({
          model,
          system: SYSTEM,
          prompt: `${header}

Résume cette discussion en texte simple (pas de Markdown), avec ces sections, chacune sur sa propre ligne terminée par deux-points : « Décisions : », « Questions ouvertes : », « Prochaines actions : » (avec la personne concernée). Listes courtes avec des tirets « - », 150 mots maximum. Omets une section vide.`,
          maxRetries: 1,
          abortSignal: AbortSignal.any([c.req.raw.signal, AbortSignal.timeout(STREAM_TIMEOUT_MS)]),
        });
        return streamTextResponse(result);
      }

      try {
        const { text } = await generateText({
          model,
          system: SYSTEM,
          prompt: `${header}

Rédige la réponse de ${names.get(member.$id) ?? "l'utilisateur"} au dernier message : courte (3 phrases maximum), utile, ton cordial et professionnel, sans formule de politesse ni signature.${instructions ? `\nConsigne : ${instructions}` : ""}`,
          maxRetries: 1,
          abortSignal: AbortSignal.timeout(GENERATE_TIMEOUT_MS),
        });
        return c.json({ data: { text: text.trim() } });
      } catch (error) {
        console.error("Assistant IA", error);
        return c.json({ error: describeAiError(error) }, 400);
      }
    },
  );

export default app;
