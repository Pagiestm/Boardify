import "server-only";

import { z } from "zod";
import { ID, Query, type Databases, type Storage } from "node-appwrite";

import { Member } from "@/features/members/types";
import { Project } from "@/features/projects/types";
import { ActivityType } from "@/features/activities/types";
import { NotificationType } from "@/features/notifications/types";
import { notifyMembers } from "@/features/notifications/server/notify";
import { describeTaskChanges, logActivities } from "@/features/activities/server/activities";
import { createChecklistItems } from "@/features/checklist/server/items";
import { validateSprint } from "@/features/sprints/server/sprints";

import { DATABASE_ID, MEMBERS_ID, PROJECTS_ID, TASKS_ID } from "@/config";

import { Task } from "../types";
import { createtaskSchema } from "../schemas";
import { deleteTaskRelations } from "./cleanup";
import { createNextOccurrence } from "./recurrence";
import { validateBlockedBy } from "./dependencies";
import { closeDeletedTaskIssue, createTaskIssue, syncTaskIssues } from "./github-sync";

export type CreateTaskInput = z.output<typeof createtaskSchema>;
export type UpdateTaskInput = Partial<CreateTaskInput>;

type MutationResult = { data: Task; error?: undefined } | { data?: undefined; error: string };

const getWorkspaceProject = async (
  databases: Databases,
  workspaceId: string,
  projectId: string,
) => {
  const project = await databases
    .getDocument<Project>(DATABASE_ID, PROJECTS_ID, projectId)
    .catch(() => null);
  return project?.workspaceId === workspaceId ? project : null;
};

const isWorkspaceMember = async (databases: Databases, workspaceId: string, memberId: string) => {
  const member = await databases
    .getDocument<Member>(DATABASE_ID, MEMBERS_ID, memberId)
    .catch(() => null);
  return member?.workspaceId === workspaceId;
};

const nextPosition = async (databases: Databases, workspaceId: string, status: string) => {
  const { documents } = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
    Query.equal("status", status),
    Query.equal("workspaceId", workspaceId),
    Query.orderAsc("position"),
    Query.limit(1),
  ]);
  return documents.length > 0 ? documents[0].position + 1000 : 1000;
};

interface CreateTaskOptions {
  /** Origine affichée dans l'historique, par exemple « assistant » pour l'assistant IA. */
  via?: string;
}

/** Crée une tâche avec ses effets : issue GitHub, checklist, activité, notification, webhooks. */
export const createTask = async (
  databases: Databases,
  memberId: string,
  input: CreateTaskInput,
  { via }: CreateTaskOptions = {},
): Promise<MutationResult> => {
  const { workspaceId, projectId, assigneeId, blockedBy, sprintId, checklist } = input;

  const [project, assigneeOk] = await Promise.all([
    getWorkspaceProject(databases, workspaceId, projectId),
    isWorkspaceMember(databases, workspaceId, assigneeId),
  ]);
  if (!project) return { error: "Projet introuvable dans cet espace" };
  if (!assigneeOk) return { error: "Le membre assigné ne fait pas partie de cet espace" };

  if (blockedBy?.length) {
    const error = await validateBlockedBy(databases, { $id: "", workspaceId }, blockedBy);
    if (error) return { error };
  }

  const sprintError = await validateSprint(databases, sprintId, projectId);
  if (sprintError) return { error: sprintError };

  const task = await databases.createDocument<Task>(DATABASE_ID, TASKS_ID, ID.unique(), {
    name: input.name,
    status: input.status,
    workspaceId,
    projectId,
    dueDate: input.dueDate.toISOString(),
    startDate: input.startDate.toISOString(),
    assigneeId,
    priority: input.priority,
    description: input.description,
    labelIds: input.labelIds ?? [],
    blockedBy: blockedBy ?? [],
    recurrence: input.recurrence ?? null,
    sprintId: sprintId ?? null,
    estimate: input.estimate ?? null,
    position: await nextPosition(databases, workspaceId, input.status),
  });

  const [linkedTask] = await Promise.all([
    createTaskIssue(databases, task),
    createChecklistItems(databases, task, checklist ?? []),
    logActivities(databases, task, memberId, [
      { type: ActivityType.CREATED, change: via ? { to: via } : undefined },
    ]),
    notifyMembers(databases, {
      workspaceId,
      taskId: task.$id,
      type: NotificationType.ASSIGNED,
      actorId: memberId,
      recipientIds: [assigneeId],
    }),
  ]);

  return { data: linkedTask ?? task };
};

/** Modifie une tâche avec ses effets : GitHub, récurrence, activité, notification, webhooks. */
export const updateTask = async (
  databases: Databases,
  memberId: string,
  existing: Task,
  input: UpdateTaskInput,
): Promise<MutationResult> => {
  const { projectId, assigneeId, blockedBy, sprintId, dueDate, startDate } = input;

  const targetProjectId = projectId ?? existing.projectId;
  const [project, assigneeOk] = await Promise.all([
    getWorkspaceProject(databases, existing.workspaceId, targetProjectId),
    assigneeId && assigneeId !== existing.assigneeId
      ? isWorkspaceMember(databases, existing.workspaceId, assigneeId)
      : true,
  ]);
  if (!project) return { error: "Projet introuvable dans cet espace" };
  if (!assigneeOk) return { error: "Le membre assigné ne fait pas partie de cet espace" };

  if (blockedBy) {
    const error = await validateBlockedBy(databases, existing, blockedBy);
    if (error) return { error };
  }

  const nextSprintId =
    sprintId !== undefined ? sprintId : targetProjectId !== existing.projectId ? null : undefined;

  if (
    nextSprintId &&
    (nextSprintId !== existing.sprintId || targetProjectId !== existing.projectId)
  ) {
    const error = await validateSprint(databases, nextSprintId, targetProjectId);
    if (error) return { error };
  }

  const task = await databases.updateDocument<Task>(DATABASE_ID, TASKS_ID, existing.$id, {
    name: input.name,
    status: input.status,
    projectId,
    dueDate: dueDate instanceof Date ? dueDate.toISOString() : dueDate,
    startDate: startDate instanceof Date ? startDate.toISOString() : startDate,
    assigneeId,
    priority: input.priority,
    description: input.description,
    labelIds: input.labelIds,
    blockedBy,
    recurrence: input.recurrence,
    sprintId: nextSprintId,
    estimate: input.estimate,
  });

  await Promise.all([
    syncTaskIssues(databases, existing.workspaceId, [{ before: existing, after: task }]),
    createNextOccurrence(databases, existing, task, memberId),
    logActivities(databases, task, memberId, describeTaskChanges(existing, task)),
    existing.assigneeId !== task.assigneeId &&
      notifyMembers(databases, {
        workspaceId: task.workspaceId,
        taskId: task.$id,
        type: NotificationType.ASSIGNED,
        actorId: memberId,
        recipientIds: [task.assigneeId],
      }),
  ]);

  return { data: task };
};

/** Supprime une tâche, ses relations et ferme son issue GitHub. */
export const deleteTask = async (databases: Databases, storage: Storage, task: Task) => {
  await databases.deleteDocument(DATABASE_ID, TASKS_ID, task.$id);
  await Promise.all([
    closeDeletedTaskIssue(databases, task),
    deleteTaskRelations(databases, storage, task.$id),
  ]);
};
