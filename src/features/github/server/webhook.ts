import "server-only";

import { Query, type Databases } from "node-appwrite";

import { Task } from "@/features/tasks/types";
import { Project } from "@/features/projects/types";
import { Workspace } from "@/features/workspaces/types";
import { parseBoardColumns } from "@/features/projects/utils";
import { extractTaskDescription, syncTaskIssues } from "@/features/tasks/server/github-sync";

import { getGithubBotLogin } from "@/lib/github";
import { DATABASE_ID, PROJECTS_ID, TASKS_ID, WORKSPACES_ID } from "@/config";

interface IssuesEvent {
  action: string;
  issue: { html_url: string; title: string; body: string | null };
  changes?: { title?: unknown; body?: unknown };
  installation?: { id: number };
  sender: { login: string; type: string };
}

interface InstallationEvent {
  action: string;
  installation: { id: number };
}

const findLinkedTask = async (databases: Databases, event: IssuesEvent) => {
  const { documents } = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
    Query.equal("githubIssueUrl", event.issue.html_url),
    Query.limit(1),
  ]);
  const task = documents[0];
  if (!task || !event.installation) return null;

  // L'événement doit venir de l'installation liée à l'espace de la tâche
  const workspace = await databases.getDocument<Workspace>(
    DATABASE_ID,
    WORKSPACES_ID,
    task.workspaceId,
  );
  return workspace.githubInstallationId === String(event.installation.id) ? task : null;
};

// Colonne cible quand l'issue est fermée (première colonne terminée) ou rouverte
// (première colonne visible non terminée), ou null si la tâche y est déjà
const getTargetStatus = (project: Project, task: Task, closed: boolean) => {
  const columns = parseBoardColumns(project.columnConfig);
  const current = columns.find((column) => column.id === task.status);
  if (current && current.done === closed) return null;

  const candidates = columns.filter((column) => column.done === closed);
  return (candidates.find((column) => !column.hidden) ?? candidates[0])?.id ?? null;
};

const handleIssuesEvent = async (databases: Databases, event: IssuesEvent) => {
  // Modifications faites par Boardify lui-même : rien à remonter
  if (event.sender.login === getGithubBotLogin()) return "ignored";

  const task = await findLinkedTask(databases, event);
  if (!task) return "ignored";

  if (event.action === "deleted") {
    await databases.updateDocument(DATABASE_ID, TASKS_ID, task.$id, { githubIssueUrl: null });
    return "unlinked";
  }

  const update: Partial<Pick<Task, "name" | "description" | "status">> = {};

  if (event.action === "closed" || event.action === "reopened") {
    const project = await databases.getDocument<Project>(DATABASE_ID, PROJECTS_ID, task.projectId);
    const status = getTargetStatus(project, task, event.action === "closed");
    if (status) update.status = status;
  }

  if (event.action === "edited") {
    if (event.changes?.title) update.name = event.issue.title;
    if (event.changes?.body) update.description = extractTaskDescription(event.issue.body);
  }

  if (Object.keys(update).length === 0) return "unchanged";

  const updated = await databases.updateDocument<Task>(DATABASE_ID, TASKS_ID, task.$id, update);

  // Remet à jour la fiche de l'issue (statut…) sans toucher à son état, déjà fixé sur GitHub
  await syncTaskIssues(databases, task.workspaceId, [{ before: task, after: updated }], {
    syncState: false,
  });

  return "updated";
};

const handleInstallationEvent = async (databases: Databases, event: InstallationEvent) => {
  if (event.action !== "deleted") return "ignored";

  const { documents } = await databases.listDocuments<Workspace>(DATABASE_ID, WORKSPACES_ID, [
    Query.equal("githubInstallationId", String(event.installation.id)),
    Query.limit(100),
  ]);

  await Promise.all(
    documents.map((workspace) =>
      databases.updateDocument(DATABASE_ID, WORKSPACES_ID, workspace.$id, {
        githubInstallationId: null,
      }),
    ),
  );

  return "unlinked";
};

export const handleGithubWebhook = async (
  databases: Databases,
  eventName: string,
  payload: unknown,
) => {
  if (eventName === "issues") return handleIssuesEvent(databases, payload as IssuesEvent);
  if (eventName === "installation") {
    return handleInstallationEvent(databases, payload as InstallationEvent);
  }
  return "ignored";
};
