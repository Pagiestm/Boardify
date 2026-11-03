import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import { NotificationType } from "@/features/notifications/types";
import { notifyMembers } from "@/features/notifications/server/notify";

import type { Db } from "@/lib/db";
import { sessionMiddleware } from "@/lib/session-middleware";

import { extractMentionIds } from "../mentions";
import { publishComment, unpublishComment } from "./github";
import { createCommentSchema, updateCommentSchema } from "../schemas";

const getTaskMember = async (db: Db, taskId: string, userId: string) => {
  const task = await db.tasks.get(taskId);
  const member = await getMember({ db, workspaceId: task.workspaceId, userId });

  return { task, member };
};

const app = new Hono()
  .get(
    "/",
    sessionMiddleware,
    zValidator("query", z.object({ taskId: z.string().min(1) })),
    async (c) => {
      const db = c.get("db");
      const { taskId } = c.req.valid("query");

      const { member } = await getTaskMember(db, taskId, c.get("user").$id);
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const comments = await db.comments.list({
        where: { taskId },
        orderBy: { $createdAt: "asc" },
        limit: 500,
      });

      return c.json({ data: comments.documents });
    },
  )
  .post("/", sessionMiddleware, zValidator("json", createCommentSchema), async (c) => {
    const db = c.get("db");
    const { taskId, content } = c.req.valid("json");

    const { task, member } = await getTaskMember(db, taskId, c.get("user").$id);
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const comment = await db.comments.create({
      workspaceId: task.workspaceId,
      taskId,
      memberId: member.$id,
      content,
    });

    const mentionIds = extractMentionIds(content);

    await Promise.all([
      publishComment(db, task, comment, member),
      notifyMembers(db, {
        workspaceId: task.workspaceId,
        taskId,
        type: NotificationType.MENTIONED,
        actorId: member.$id,
        recipientIds: mentionIds,
      }),
      !mentionIds.includes(task.assigneeId) &&
        notifyMembers(db, {
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
    const db = c.get("db");
    const { content } = c.req.valid("json");

    const existing = await db.comments.get(c.req.param("commentId"));
    const { task, member } = await getTaskMember(db, existing.taskId, c.get("user").$id);

    if (!member || member.$id !== existing.memberId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const comment = await db.comments.update(existing.$id, { content });

    const newMentions = extractMentionIds(content).filter(
      (memberId) => !extractMentionIds(existing.content).includes(memberId),
    );

    await Promise.all([
      publishComment(db, task, comment, member),
      notifyMembers(db, {
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
    const db = c.get("db");

    const comment = await db.comments.get(c.req.param("commentId"));
    const { task, member } = await getTaskMember(db, comment.taskId, c.get("user").$id);

    if (!member || (member.$id !== comment.memberId && member.role !== MemberRole.ADMIN)) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await db.comments.delete(comment.$id);
    await unpublishComment(db, task, comment);

    return c.json({ data: { $id: comment.$id, taskId: comment.taskId } });
  });

export default app;
