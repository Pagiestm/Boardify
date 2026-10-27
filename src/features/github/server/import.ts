import "server-only";

import { ID, Query, type Databases } from "node-appwrite";

import { Label } from "@/features/labels/types";
import { Member } from "@/features/members/types";
import { Project } from "@/features/projects/types";
import { parseBoardColumns } from "@/features/projects/utils";
import { Task, TaskPriority } from "@/features/tasks/types";
import { extractTaskDescription, PRIORITY_LABELS } from "@/features/tasks/server/github-sync";

import { createAdminClient } from "@/lib/appwrite";
import { listGithubOpenIssues } from "@/lib/github";
import { DATABASE_ID, LABELS_ID, MEMBERS_ID, TASKS_ID } from "@/config";

import { resolveGithubAccount } from "./accounts";

const DEFAULT_DURATION = 7 * 24 * 60 * 60 * 1000;

const chunk = <T>(values: T[], size: number) =>
  Array.from({ length: Math.ceil(values.length / size) }, (_, index) =>
    values.slice(index * size, index * size + size),
  );

// Crée une tâche pour chaque issue ouverte du dépôt lié au projet qui n'en a pas encore.
// Les issues ne sont pas modifiées : elles le seront à la première modification de la tâche.
export const importGithubIssues = async ({
  databases,
  project,
  installationId,
  fallbackMemberId,
}: {
  databases: Databases;
  project: Project & { githubRepo: string };
  installationId: string;
  fallbackMemberId: string;
}) => {
  const issues = await listGithubOpenIssues(installationId, project.githubRepo);

  // Issues déjà liées à une tâche de l'espace
  const linkedUrls = new Set<string>();
  for (const urls of chunk(
    issues.map((issue) => issue.url),
    100,
  )) {
    const { documents } = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
      Query.equal("workspaceId", project.workspaceId),
      Query.equal("githubIssueUrl", urls),
      Query.limit(100),
    ]);
    documents.forEach((task) => task.githubIssueUrl && linkedUrls.add(task.githubIssueUrl));
  }

  const toImport = issues.filter((issue) => !linkedUrls.has(issue.url));
  if (toImport.length === 0) return { imported: 0, skipped: issues.length };

  const [{ documents: members }, { documents: labels }] = await Promise.all([
    databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, [
      Query.equal("workspaceId", project.workspaceId),
      Query.limit(100),
    ]),
    databases.listDocuments<Label>(DATABASE_ID, LABELS_ID, [
      Query.equal("workspaceId", project.workspaceId),
      Query.limit(100),
    ]),
  ]);

  // Compte GitHub → membre, pour reprendre l'assigné de l'issue
  const { users } = await createAdminClient();
  const memberByLogin = new Map<string, string>();
  await Promise.all(
    members.map(async (member) => {
      const account = await resolveGithubAccount(users, member.userId, installationId).catch(
        () => null,
      );
      if (account) memberByLogin.set(account.login.toLowerCase(), member.$id);
    }),
  );

  const labelByName = new Map(labels.map((label) => [label.name.toLowerCase(), label.$id]));
  const priorityByLabel = new Map(
    Object.entries(PRIORITY_LABELS).map(([priority, label]) => [
      label.name.toLowerCase(),
      priority as TaskPriority,
    ]),
  );

  const columns = parseBoardColumns(project.columnConfig);
  const status = (columns.find((column) => !column.done && !column.hidden) ?? columns[0]).id;

  const lowestPositionTask = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
    Query.equal("status", status),
    Query.equal("workspaceId", project.workspaceId),
    Query.orderAsc("position"),
    Query.limit(1),
  ]);
  const basePosition = lowestPositionTask.documents[0]?.position ?? 0;

  const now = Date.now();
  let imported = 0;

  for (const [index, issue] of toImport.entries()) {
    const issueLabels = issue.labels.map((name) => name.toLowerCase());
    const dueDate = issue.milestoneDueOn
      ? new Date(issue.milestoneDueOn)
      : new Date(now + DEFAULT_DURATION);
    const startDate = new Date(Math.min(now, dueDate.getTime()));

    try {
      await databases.createDocument<Task>(DATABASE_ID, TASKS_ID, ID.unique(), {
        name: issue.title,
        description: extractTaskDescription(issue.body),
        status,
        workspaceId: project.workspaceId,
        projectId: project.$id,
        assigneeId:
          issue.assignees
            .map((login) => memberByLogin.get(login.toLowerCase()))
            .find((memberId) => !!memberId) ?? fallbackMemberId,
        priority:
          issueLabels.map((name) => priorityByLabel.get(name)).find((priority) => !!priority) ??
          TaskPriority.MEDIUM,
        labelIds: issueLabels
          .map((name) => labelByName.get(name))
          .filter((labelId): labelId is string => !!labelId),
        startDate: startDate.toISOString(),
        dueDate: dueDate.toISOString(),
        position: basePosition + (index + 1) * 1000,
        githubIssueUrl: issue.url,
      });
      imported++;
    } catch (error) {
      console.error(`Import de l'issue ${issue.url} impossible`, error);
    }
  }

  return { imported, skipped: issues.length - toImport.length };
};
