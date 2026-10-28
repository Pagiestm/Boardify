import { z } from "zod";
import { Hono } from "hono";
import { ID, Query, type Databases } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { Task } from "@/features/tasks/types";
import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import { NotificationType } from "@/features/notifications/types";
import { notifyMembers } from "@/features/notifications/server/notify";

import { sessionMiddleware } from "@/lib/session-middleware";
import { COMMENTS_ID, DATABASE_ID, TASKS_ID } from "@/config";

import { Comment } from "../types";
import { extractMentionIds } from "../mentions";
import { publishComment, unpublishComment } from "./github";
import { createCommentSchema, updateCommentSchema } from "../schemas";

const getTaskMember = async (databases: Databases, taskId: string, userId: string) => {
  const task = await databases.getDocument<Task>(DATABASE_ID, TASKS_ID, taskId);
  const member = await getMember({ databases, workspaceId: task.workspaceId, userId });

  return { task, member };
};

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ taskId: z.string().min(1) })),
    async (c) => {
      const databases = c.get("databases");
      const { taskId } = c.req.valid("query");

      const { member } = await getTaskMember(databases, taskId, c.get("user").$id);
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const comments = await databases.listDocuments<Comment>(DATABASE_ID, COMMENTS_ID, [
        Query.equal("taskId", taskId),
        Query.orderAsc("$createdAt"),
        Query.limit(500),
      ]);

      return c.json({ data: comments.documents });
    },
  )
  .post("/", sessionMiddleware, zValidator("json", createCommentSchema), async (c) => {
    const databases = c.get("databases");
    const { taskId, content } = c.req.valid("json");

    const { task, member } = await getTaskMember(databases, taskId, c.get("user").$id);
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const comment = await databases.createDocument<Comment>(DATABASE_ID, COMMENTS_ID, ID.unique(), {
      workspaceId: task.workspaceId,
      taskId,
      memberId: member.$id,
      content,
    });

    const mentionIds = extractMentionIds(content);

    await Promise.all([
      publishComment(databases, task, comment, member),
      notifyMembers(databases, {
        workspaceId: task.workspaceId,
        taskId,
        type: NotificationType.MENTIONED,
        actorId: member.$id,
        recipientIds: mentionIds,
      }),
      !mentionIds.includes(task.assigneeId) &&
        notifyMembers(databases, {
          workspaceId: task.workspaceId,
          taskId,
          type: NotificationType.COMMENTED,
          actorId: member.$id,
          recipientIds: [task.assigneeId],
        }),
    ]);

    return c.json({ data: comment });
  })
  .patch("/:commentId", sessionMiddleware, zValidator("json", updateCommentSchema), async (c) => {
    const databases = c.get("databases");
    const { content } = c.req.valid("json");

    const existing = await databases.getDocument<Comment>(
      DATABASE_ID,
      COMMENTS_ID,
      c.req.param("commentId"),
    );
    const { task, member } = await getTaskMember(databases, existing.taskId, c.get("user").$id);

    if (!member || member.$id !== existing.memberId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const comment = await databases.updateDocument<Comment>(
      DATABASE_ID,
      COMMENTS_ID,
      existing.$id,
      { content },
    );

    const newMentions = extractMentionIds(content).filter(
      (memberId) => !extractMentionIds(existing.content).includes(memberId),
    );

    await Promise.all([
      publishComment(databases, task, comment, member),
      notifyMembers(databases, {
        workspaceId: task.workspaceId,
        taskId: task.$id,
        type: NotificationType.MENTIONED,
        actorId: member.$id,
        recipientIds: newMentions,
      }),
    ]);

    return c.json({ data: comment });
  })
  .delete("/:commentId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");

    const comment = await databases.getDocument<Comment>(
      DATABASE_ID,
      COMMENTS_ID,
      c.req.param("commentId"),
    );
    const { task, member } = await getTaskMember(databases, comment.taskId, c.get("user").$id);

    if (!member || (member.$id !== comment.memberId && member.role !== MemberRole.ADMIN)) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await databases.deleteDocument(DATABASE_ID, COMMENTS_ID, comment.$id);
    await unpublishComment(databases, task, comment);

    return c.json({ data: { $id: comment.$id, taskId: comment.taskId } });
  });

export default app;
