import "server-only";

import { z } from "zod";

import { ActivityType } from "@/features/activities/types";
import { NotificationType } from "@/features/notifications/types";
import { notifyMembers } from "@/features/notifications/server/notify";
import { describeTaskChanges, logActivities } from "@/features/activities/server/activities";
import { createChecklistItems } from "@/features/checklist/server/items";
import { validateSprint } from "@/features/sprints/server/sprints";

import type { Db } from "@/lib/db";
import type { FileStore } from "@/lib/files";

import { Task } from "../types";
import { createtaskSchema } from "../schemas";
import { deleteTaskRelations } from "./cleanup";
import { createNextOccurrence } from "./recurrence";
import { validateBlockedBy } from "./dependencies";
import { closeDeletedTaskIssue, createTaskIssue, syncTaskIssues } from "./github-sync";

export type CreateTaskInput = z.output<typeof createtaskSchema>;
export type UpdateTaskInput = Partial<CreateTaskInput>;

type MutationResult = { data: Task; error?: undefined } | { data?: undefined; error: string };

const getWorkspaceProject = async (db: Db, workspaceId: string, projectId: string) => {
  const project = await db.projects.get(projectId).catch(() => null);
  return project?.workspaceId === workspaceId ? project : null;
};

const isWorkspaceMember = async (db: Db, workspaceId: string, memberId: string) => {
  const member = await db.members.get(memberId).catch(() => null);
  return member?.workspaceId === workspaceId;
};

/** Les étiquettes doivent toutes appartenir à l'espace de la tâche. */
const validateLabels = async (db: Db, workspaceId: string, labelIds: string[] | undefined) => {
  const ids = [...new Set(labelIds ?? [])];
  if (ids.length === 0) return null;
  const count = await db.labels.count({ $id: ids, workspaceId });
  return count === ids.length ? null : "Étiquette introuvable dans cet espace";
};

const nextPosition = async (db: Db, workspaceId: string, status: string) => {
  const { documents } = await db.tasks.list({
    where: { status, workspaceId },
    orderBy: { position: "asc" },
    limit: 1,
  });
  return documents.length > 0 ? documents[0].position + 1000 : 1000;
};

interface CreateTaskOptions {
  /** Origine affichée dans l'historique, par exemple « assistant » pour l'assistant IA. */
  via?: string;
}

/** Crée une tâche avec ses effets : issue GitHub, checklist, activité, notification, webhooks. */
export const createTask = async (
  db: Db,
  memberId: string,
  input: CreateTaskInput,
  { via }: CreateTaskOptions = {},
): Promise<MutationResult> => {
  const { workspaceId, projectId, assigneeId, blockedBy, sprintId, checklist } = input;

  const [project, assigneeOk] = await Promise.all([
    getWorkspaceProject(db, workspaceId, projectId),
    isWorkspaceMember(db, workspaceId, assigneeId),
  ]);
  if (!project) return { error: "Projet introuvable dans cet espace" };
  if (!assigneeOk) return { error: "Le membre assigné ne fait pas partie de cet espace" };

  if (blockedBy?.length) {
    const error = await validateBlockedBy(db, { $id: "", workspaceId }, blockedBy);
    if (error) return { error };
  }

  const sprintError = await validateSprint(db, sprintId, projectId);
  if (sprintError) return { error: sprintError };

  const labelsError = await validateLabels(db, workspaceId, input.labelIds);
  if (labelsError) return { error: labelsError };

  const task = await db.tasks.create({
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
    position: await nextPosition(db, workspaceId, input.status),
  });

  const [linkedTask] = await Promise.all([
    createTaskIssue(db, task),
    createChecklistItems(db, task, checklist ?? []),
    logActivities(db, task, memberId, [
      { type: ActivityType.CREATED, change: via ? { to: via } : undefined },
    ]),
    notifyMembers(db, {
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
  db: Db,
  memberId: string,
  existing: Task,
  input: UpdateTaskInput,
): Promise<MutationResult> => {
  const { projectId, assigneeId, blockedBy, sprintId, dueDate, startDate } = input;

  const targetProjectId = projectId ?? existing.projectId;
  const [project, assigneeOk] = await Promise.all([
    getWorkspaceProject(db, existing.workspaceId, targetProjectId),
    assigneeId && assigneeId !== existing.assigneeId
      ? isWorkspaceMember(db, existing.workspaceId, assigneeId)
      : true,
  ]);
  if (!project) return { error: "Projet introuvable dans cet espace" };
  if (!assigneeOk) return { error: "Le membre assigné ne fait pas partie de cet espace" };

  if (blockedBy) {
    const error = await validateBlockedBy(db, existing, blockedBy);
    if (error) return { error };
  }

  const nextSprintId =
    sprintId !== undefined ? sprintId : targetProjectId !== existing.projectId ? null : undefined;

  if (
    nextSprintId &&
    (nextSprintId !== existing.sprintId || targetProjectId !== existing.projectId)
  ) {
    const error = await validateSprint(db, nextSprintId, targetProjectId);
    if (error) return { error };
  }

  const labelsError = await validateLabels(db, existing.workspaceId, input.labelIds);
  if (labelsError) return { error: labelsError };

  const task = await db.tasks.update(existing.$id, {
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
    syncTaskIssues(db, existing.workspaceId, [{ before: existing, after: task }]),
    createNextOccurrence(db, existing, task, memberId),
    logActivities(db, task, memberId, describeTaskChanges(existing, task)),
    existing.assigneeId !== task.assigneeId &&
      notifyMembers(db, {
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
export const deleteTask = async (db: Db, files: FileStore, task: Task) => {
  await db.tasks.delete(task.$id);
  await Promise.all([closeDeletedTaskIssue(db, task), deleteTaskRelations(db, files, task.$id)]);
};
