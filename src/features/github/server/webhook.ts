import "server-only";

import { ID, Query, type Databases } from "node-appwrite";

import { Task } from "@/features/tasks/types";
import { Project } from "@/features/projects/types";
import { Workspace } from "@/features/workspaces/types";
import { parseBoardColumns } from "@/features/projects/utils";
import { ActivityType } from "@/features/activities/types";
import { logActivities } from "@/features/activities/server/activities";
import { extractTaskDescription, syncTaskIssues } from "@/features/tasks/server/github-sync";

import { Member } from "@/features/members/types";
import { NotificationType } from "@/features/notifications/types";
import { notifyMembers } from "@/features/notifications/server/notify";
import { Comment, GITHUB_AUTHOR_PREFIX } from "@/features/comments/types";

import { createAdminClient } from "@/lib/appwrite";
import { getGithubBotLogin } from "@/lib/github";
import {
  COMMENTS_ID,
  DATABASE_ID,
  MEMBERS_ID,
  PROJECTS_ID,
  TASKS_ID,
  WORKSPACES_ID,
} from "@/config";

import { resolveGithubAccount } from "./accounts";

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

interface IssueCommentEvent {
  action: string;
  issue: { html_url: string };
  comment: { id: number; body: string | null };
  installation?: { id: number };
  sender: { login: string; type: string };
}

const BOARDIFY_COMMENT_HEADER = /^\*\*[^*\n]+\*\* · via Boardify\n\n/;

const findLinkedTask = async (
  databases: Databases,
  event: { issue: { html_url: string }; installation?: { id: number } },
) => {
  const { documents } = await databases.listDocuments<Task>(DATABASE_ID, TASKS_ID, [
    Query.equal("githubIssueUrl", event.issue.html_url),
    Query.limit(1),
  ]);
  const task = documents[0];
  if (!task || !event.installation) return null;

  const workspace = await databases.getDocument<Workspace>(
    DATABASE_ID,
    WORKSPACES_ID,
    task.workspaceId,
  );
  return workspace.githubInstallationId === String(event.installation.id) ? task : null;
};

const getTargetStatus = (project: Project, task: Task, closed: boolean) => {
  const columns = parseBoardColumns(project.columnConfig);
  const current = columns.find((column) => column.id === task.status);
  if (current && current.done === closed) return null;

  const candidates = columns.filter((column) => column.done === closed);
  return (candidates.find((column) => !column.hidden) ?? candidates[0])?.id ?? null;
};

const handleIssuesEvent = async (databases: Databases, event: IssuesEvent) => {
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
  const activityType = update.status
    ? event.action === "closed"
      ? ActivityType.GITHUB_CLOSED
      : ActivityType.GITHUB_REOPENED
    : ActivityType.GITHUB_EDITED;

  await Promise.all([
    syncTaskIssues(databases, task.workspaceId, [{ before: task, after: updated }], {
      syncState: false,
    }),
    logActivities(databases, updated, null, [
      { type: activityType, change: { to: event.sender.login } },
    ]),
  ]);

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

const findMemberByLogin = async (
  databases: Databases,
  workspaceId: string,
  installationId: string,
  login: string,
) => {
  const { documents: members } = await databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, [
    Query.equal("workspaceId", workspaceId),
    Query.limit(100),
  ]);
  const { users } = await createAdminClient();

  for (const member of members) {
    const account = await resolveGithubAccount(users, member.userId, installationId).catch(
      () => null,
    );
    if (account?.login.toLowerCase() === login.toLowerCase()) return member;
  }

  return null;
};

const findCommentByGithubId = async (databases: Databases, githubCommentId: number) => {
  const { documents } = await databases.listDocuments<Comment>(DATABASE_ID, COMMENTS_ID, [
    Query.equal("githubCommentId", String(githubCommentId)),
    Query.limit(1),
  ]);
  return documents[0] ?? null;
};

const handleIssueCommentEvent = async (databases: Databases, event: IssueCommentEvent) => {
  if (event.sender.login === getGithubBotLogin()) return "ignored";

  const task = await findLinkedTask(databases, event);
  if (!task || !event.installation) return "ignored";

  const content = (event.comment.body ?? "").replace(BOARDIFY_COMMENT_HEADER, "").slice(0, 5000);
  const existing = await findCommentByGithubId(databases, event.comment.id);

  if (event.action === "deleted") {
    if (!existing) return "ignored";
    await databases.deleteDocument(DATABASE_ID, COMMENTS_ID, existing.$id);
    return "deleted";
  }

  if (!content.trim()) return "ignored";

  if (existing) {
    await databases.updateDocument(DATABASE_ID, COMMENTS_ID, existing.$id, { content });
    return "updated";
  }

  if (event.action !== "created") return "ignored";

  const member = await findMemberByLogin(
    databases,
    task.workspaceId,
    String(event.installation.id),
    event.sender.login,
  );

  await databases.createDocument(DATABASE_ID, COMMENTS_ID, ID.unique(), {
    workspaceId: task.workspaceId,
    taskId: task.$id,
    memberId: member?.$id ?? `${GITHUB_AUTHOR_PREFIX}${event.sender.login}`,
    content,
    githubCommentId: String(event.comment.id),
  });

  await notifyMembers(databases, {
    workspaceId: task.workspaceId,
    taskId: task.$id,
    type: NotificationType.COMMENTED,
    actorId: member?.$id ?? `${GITHUB_AUTHOR_PREFIX}${event.sender.login}`,
    recipientIds: [task.assigneeId],
  });

  return "created";
};

export const handleGithubWebhook = async (
  databases: Databases,
  eventName: string,
  payload: unknown,
) => {
  if (eventName === "issues") return handleIssuesEvent(databases, payload as IssuesEvent);
  if (eventName === "issue_comment") {
    return handleIssueCommentEvent(databases, payload as IssueCommentEvent);
  }
  if (eventName === "installation") {
    return handleInstallationEvent(databases, payload as InstallationEvent);
  }
  return "ignored";
};
