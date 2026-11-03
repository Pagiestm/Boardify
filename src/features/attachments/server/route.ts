import { z } from "zod";
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";

import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import { ActivityType } from "@/features/activities/types";
import { logActivities } from "@/features/activities/server/activities";

import type { Db } from "@/lib/db";
import { sessionMiddleware } from "@/lib/session-middleware";

import { MAX_ATTACHMENT_SIZE } from "../types";

const INLINE_TYPES = /^(image\/(png|jpe?g|gif|webp|avif)|application\/pdf)$/;

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

      const attachments = await db.attachments.list({
        where: { taskId },
        orderBy: { $createdAt: "desc" },
        limit: 200,
      });

      return c.json({ data: attachments.documents });
    },
  )
  .post(
    "/",
    sessionMiddleware,
    zValidator("form", z.object({ taskId: z.string().min(1), file: z.instanceof(File) })),
    async (c) => {
      const db = c.get("db");
      const files = c.get("files");
      const { taskId, file } = c.req.valid("form");

      if (file.size > MAX_ATTACHMENT_SIZE) {
        return c.json({ error: "Le fichier dépasse 10 Mo" }, 400);
      }

      const { task, member } = await getTaskMember(db, taskId, c.get("user").$id);
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const stored = await files.upload(file);
      const attachment = await db.attachments.create({
        workspaceId: task.workspaceId,
        taskId,
        memberId: member.$id,
        fileId: stored.id,
        name: file.name.slice(0, 255),
        mimeType: file.type ? file.type.slice(0, 100) : null,
        size: file.size,
      });

      await logActivities(db, task, member.$id, [
        { type: ActivityType.ATTACHMENT_ADDED, change: { to: attachment.name } },
      ]);

      return c.json({ data: attachment });
    },
  )
  .get("/:attachmentId/file", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const files = c.get("files");

    const attachment = await db.attachments.get(c.req.param("attachmentId"));
    const { member } = await getTaskMember(db, attachment.taskId, c.get("user").$id);
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const content = await files.read(attachment.fileId);
    if (!content) return c.json({ error: "Not found" }, 404);
    const inline = !c.req.query("download") && INLINE_TYPES.test(attachment.mimeType ?? "");

    return new Response(content.data, {
      headers: {
        "Content-Type": inline ? attachment.mimeType! : "application/octet-stream",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  })
  .delete("/:attachmentId", sessionMiddleware, async (c) => {
    const db = c.get("db");
    const files = c.get("files");

    const attachment = await db.attachments.get(c.req.param("attachmentId"));
    const { task, member } = await getTaskMember(db, attachment.taskId, c.get("user").$id);

    if (!member || (member.$id !== attachment.memberId && member.role !== MemberRole.ADMIN)) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await db.attachments.delete(attachment.$id);
    await Promise.all([
      files.delete(attachment.fileId).catch(() => null),
      logActivities(db, task, member.$id, [
        { type: ActivityType.ATTACHMENT_REMOVED, change: { from: attachment.name } },
      ]),
    ]);

    return c.json({ data: { $id: attachment.$id, taskId: attachment.taskId } });
  });

export default app;
