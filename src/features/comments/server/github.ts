import "server-only";

import { Task } from "@/features/tasks/types";
import { Member } from "@/features/members/types";
import { resolveGithubAccount } from "@/features/github/server/accounts";

import type { Db } from "@/lib/db";
import { getUserIdentity } from "@/lib/users";
import { createGithubComment, deleteGithubComment, updateGithubComment } from "@/lib/github";

import { Comment } from "../types";
import { extractMentionIds, replaceMentions } from "../mentions";

const getIssue = async (db: Db, task: Task) => {
  if (!task.githubIssueUrl) return null;

  const workspace = await db.workspaces.get(task.workspaceId);
  if (!workspace.githubInstallationId) return null;

  return { installationId: workspace.githubInstallationId, issueUrl: task.githubIssueUrl };
};

const renderBody = async (db: Db, installationId: string, comment: Comment, author: Member) => {
  const mentionIds = extractMentionIds(comment.content);

  const mentioned =
    mentionIds.length > 0
      ? (
          await db.members.list({
            where: { $id: mentionIds },
            limit: 100,
          })
        ).documents
      : [];

  const logins = new Map(
    await Promise.all(
      mentioned.map(
        async (member) =>
          [
            member.$id,
            (await resolveGithubAccount(member.userId, installationId).catch(() => null))?.login,
          ] as const,
      ),
    ),
  );

  const { name } = await getUserIdentity(author.userId);
  const text = replaceMentions(comment.content, (mentionName, memberId) => {
    const login = logins.get(memberId);
    return login ? `@${login}` : `@${mentionName}`;
  });

  return `**${name}** · via Boardify\n\n${text}`;
};

export const publishComment = async (db: Db, task: Task, comment: Comment, author: Member) => {
  try {
    const issue = await getIssue(db, task);
    if (!issue) return;

    const body = await renderBody(db, issue.installationId, comment, author);

    if (comment.githubCommentId) {
      await updateGithubComment(
        issue.installationId,
        issue.issueUrl,
        comment.githubCommentId,
        body,
      );
      return;
    }

    const githubCommentId = await createGithubComment(issue.installationId, issue.issueUrl, body);
    if (githubCommentId) {
      await db.comments.update(comment.$id, { githubCommentId });
    }
  } catch (error) {
    console.error("Synchronisation du commentaire avec GitHub impossible", error);
  }
};

export const unpublishComment = async (db: Db, task: Task, comment: Comment) => {
  if (!comment.githubCommentId) return;

  try {
    const issue = await getIssue(db, task);
    if (!issue) return;

    await deleteGithubComment(issue.installationId, issue.issueUrl, comment.githubCommentId);
  } catch (error) {
    console.error("Suppression du commentaire sur GitHub impossible", error);
  }
};
