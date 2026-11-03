import "server-only";

import { Task } from "@/features/tasks/types";
import { Project } from "@/features/projects/types";
import { parseBoardColumns } from "@/features/projects/utils";
import { ActivityType } from "@/features/activities/types";
import { logActivities } from "@/features/activities/server/activities";
import { createNextOccurrence } from "@/features/tasks/server/recurrence";
import { extractTaskDescription, syncTaskIssues } from "@/features/tasks/server/github-sync";

import { NotificationType } from "@/features/notifications/types";
import { notifyMembers } from "@/features/notifications/server/notify";
import { GITHUB_AUTHOR_PREFIX } from "@/features/comments/types";

import type { Db } from "@/lib/db";
import { getGithubBotLogin } from "@/lib/github";

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
  db: Db,
  event: { issue: { html_url: string }; installation?: { id: number } },
) => {
  const { documents } = await db.tasks.list({
    where: { githubIssueUrl: event.issue.html_url },
    limit: 1,
  });
  const task = documents[0];
  if (!task || !event.installation) return null;

  const workspace = await db.workspaces.get(task.workspaceId);
  return workspace.githubInstallationId === String(event.installation.id) ? task : null;
};

const getTargetStatus = (project: Project, task: Task, closed: boolean) => {
  const columns = parseBoardColumns(project.columnConfig);
  const current = columns.find((column) => column.id === task.status);
  if (current && current.done === closed) return null;

  const candidates = columns.filter((column) => column.done === closed);
  return (candidates.find((column) => !column.hidden) ?? candidates[0])?.id ?? null;
};

const handleIssuesEvent = async (db: Db, event: IssuesEvent) => {
  if (event.sender.login === getGithubBotLogin()) return "ignored";

  const task = await findLinkedTask(db, event);
  if (!task) return "ignored";

  if (event.action === "deleted") {
    await db.tasks.update(task.$id, { githubIssueUrl: null });
    return "unlinked";
  }

  const update: Partial<Pick<Task, "name" | "description" | "status">> = {};

  if (event.action === "closed" || event.action === "reopened") {
    const project = await db.projects.get(task.projectId);
    const status = getTargetStatus(project, task, event.action === "closed");
    if (status) update.status = status;
  }

  if (event.action === "edited") {
    if (event.changes?.title) update.name = event.issue.title;
    if (event.changes?.body) update.description = extractTaskDescription(event.issue.body);
  }

  if (Object.keys(update).length === 0) return "unchanged";

  const updated = await db.tasks.update(task.$id, update);
  const activityType = update.status
    ? event.action === "closed"
      ? ActivityType.GITHUB_CLOSED
      : ActivityType.GITHUB_REOPENED
    : ActivityType.GITHUB_EDITED;

  await Promise.all([
    syncTaskIssues(db, task.workspaceId, [{ before: task, after: updated }], {
      syncState: false,
    }),
    createNextOccurrence(db, task, updated, null),
    logActivities(db, updated, null, [{ type: activityType, change: { to: event.sender.login } }]),
  ]);

  return "updated";
};

const handleInstallationEvent = async (db: Db, event: InstallationEvent) => {
  if (event.action !== "deleted") return "ignored";

  const { documents } = await db.workspaces.list({
    where: { githubInstallationId: String(event.installation.id) },
    limit: 100,
  });

  await Promise.all(
    documents.map((workspace) =>
      db.workspaces.update(workspace.$id, { githubInstallationId: null }),
    ),
  );

  return "unlinked";
};

const findMemberByLogin = async (
  db: Db,
  workspaceId: string,
  installationId: string,
  login: string,
) => {
  const { documents: members } = await db.members.list({ where: { workspaceId }, limit: 100 });

  for (const member of members) {
    const account = await resolveGithubAccount(member.userId, installationId).catch(() => null);
    if (account?.login.toLowerCase() === login.toLowerCase()) return member;
  }

  return null;
};

const findCommentByGithubId = async (db: Db, githubCommentId: number) => {
  const { documents } = await db.comments.list({
    where: { githubCommentId: String(githubCommentId) },
    limit: 1,
  });
  return documents[0] ?? null;
};

const handleIssueCommentEvent = async (db: Db, event: IssueCommentEvent) => {
  if (event.sender.login === getGithubBotLogin()) return "ignored";

  const task = await findLinkedTask(db, event);
  if (!task || !event.installation) return "ignored";

  const content = (event.comment.body ?? "").replace(BOARDIFY_COMMENT_HEADER, "").slice(0, 5000);
  const existing = await findCommentByGithubId(db, event.comment.id);

  if (event.action === "deleted") {
    if (!existing) return "ignored";
    await db.comments.delete(existing.$id);
    return "deleted";
  }

  if (!content.trim()) return "ignored";

  if (existing) {
    await db.comments.update(existing.$id, { content });
    return "updated";
  }

  if (event.action !== "created") return "ignored";

  const member = await findMemberByLogin(
    db,
    task.workspaceId,
    String(event.installation.id),
    event.sender.login,
  );

  await db.comments.create({
    workspaceId: task.workspaceId,
    taskId: task.$id,
    memberId: member?.$id ?? `${GITHUB_AUTHOR_PREFIX}${event.sender.login}`,
    content,
    githubCommentId: String(event.comment.id),
  });

  await notifyMembers(db, {
    workspaceId: task.workspaceId,
    taskId: task.$id,
    type: NotificationType.COMMENTED,
    actorId: member?.$id ?? `${GITHUB_AUTHOR_PREFIX}${event.sender.login}`,
    recipientIds: [task.assigneeId],
  });

  return "created";
};

export const handleGithubWebhook = async (db: Db, eventName: string, payload: unknown) => {
  if (eventName === "issues") return handleIssuesEvent(db, payload as IssuesEvent);
  if (eventName === "issue_comment") {
    return handleIssueCommentEvent(db, payload as IssueCommentEvent);
  }
  if (eventName === "installation") {
    return handleInstallationEvent(db, payload as InstallationEvent);
  }
  return "ignored";
};
