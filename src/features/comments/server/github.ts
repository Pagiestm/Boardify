import "server-only";

import { Query, type Databases } from "node-appwrite";

import { Task } from "@/features/tasks/types";
import { Member } from "@/features/members/types";
import { Workspace } from "@/features/workspaces/types";
import { resolveGithubAccount } from "@/features/github/server/accounts";

import { getUserIdentity } from "@/lib/users";
import { createAdminClient } from "@/lib/appwrite";
import { createGithubComment, deleteGithubComment, updateGithubComment } from "@/lib/github";
import { COMMENTS_ID, DATABASE_ID, MEMBERS_ID, WORKSPACES_ID } from "@/config";

import { Comment } from "../types";
import { extractMentionIds, replaceMentions } from "../mentions";

const getIssue = async (databases: Databases, task: Task) => {
  if (!task.githubIssueUrl) return null;

  const workspace = await databases.getDocument<Workspace>(
    DATABASE_ID,
    WORKSPACES_ID,
    task.workspaceId,
  );
  if (!workspace.githubInstallationId) return null;

  return { installationId: workspace.githubInstallationId, issueUrl: task.githubIssueUrl };
};

const renderBody = async (
  databases: Databases,
  installationId: string,
  comment: Comment,
  author: Member,
) => {
  const { users } = await createAdminClient();
  const mentionIds = extractMentionIds(comment.content);

  const mentioned =
    mentionIds.length > 0
      ? (
          await databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, [
            Query.equal("$id", mentionIds),
            Query.limit(100),
          ])
        ).documents
      : [];

  const logins = new Map(
    await Promise.all(
      mentioned.map(
        async (member) =>
          [
            member.$id,
            (await resolveGithubAccount(users, member.userId, installationId).catch(() => null))
              ?.login,
          ] as const,
      ),
    ),
  );

  const { name } = await getUserIdentity(users, author.userId);
  const text = replaceMentions(comment.content, (mentionName, memberId) => {
    const login = logins.get(memberId);
    return login ? `@${login}` : `@${mentionName}`;
  });

  return `**${name}** · via Boardify\n\n${text}`;
};

export const publishComment = async (
  databases: Databases,
  task: Task,
  comment: Comment,
  author: Member,
) => {
  try {
    const issue = await getIssue(databases, task);
    if (!issue) return;

    const body = await renderBody(databases, issue.installationId, comment, author);

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
      await databases.updateDocument(DATABASE_ID, COMMENTS_ID, comment.$id, { githubCommentId });
    }
  } catch (error) {
    console.error("Synchronisation du commentaire avec GitHub impossible", error);
  }
};

export const unpublishComment = async (databases: Databases, task: Task, comment: Comment) => {
  if (!comment.githubCommentId) return;

  try {
    const issue = await getIssue(databases, task);
    if (!issue) return;

    await deleteGithubComment(issue.installationId, issue.issueUrl, comment.githubCommentId);
  } catch (error) {
    console.error("Suppression du commentaire sur GitHub impossible", error);
  }
};
