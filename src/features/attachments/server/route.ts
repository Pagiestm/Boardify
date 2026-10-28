import { z } from "zod";
import { Hono } from "hono";
import { ID, Query, type Databases } from "node-appwrite";
import { zValidator } from "@hono/zod-validator";

import { Task } from "@/features/tasks/types";
import { getMember } from "@/features/members/utils";
import { MemberRole } from "@/features/members/types";
import { ActivityType } from "@/features/activities/types";
import { logActivities } from "@/features/activities/server/activities";

import { sessionMiddleware } from "@/lib/session-middleware";
import { ATTACHMENTS_ID, DATABASE_ID, IMAGES_BUCKET_ID, TASKS_ID } from "@/config";

import { Attachment, MAX_ATTACHMENT_SIZE } from "../types";

const INLINE_TYPES = /^(image\/(png|jpe?g|gif|webp|avif)|application\/pdf)$/;

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

      const attachments = await databases.listDocuments<Attachment>(DATABASE_ID, ATTACHMENTS_ID, [
        Query.equal("taskId", taskId),
        Query.orderDesc("$createdAt"),
        Query.limit(200),
      ]);

      return c.json({ data: attachments.documents });
    },
  )
  .post(
    "/",
    sessionMiddleware,
    zValidator("form", z.object({ taskId: z.string().min(1), file: z.instanceof(File) })),
    async (c) => {
      const databases = c.get("databases");
      const storage = c.get("storage");
      const { taskId, file } = c.req.valid("form");

      if (file.size > MAX_ATTACHMENT_SIZE) {
        return c.json({ error: "Le fichier dépasse 10 Mo" }, 400);
      }

      const { task, member } = await getTaskMember(databases, taskId, c.get("user").$id);
      if (!member) {
        return c.json({ error: "Unauthorized" }, 401);
      }

      const stored = await storage.createFile(IMAGES_BUCKET_ID, ID.unique(), file);
      const attachment = await databases.createDocument<Attachment>(
        DATABASE_ID,
        ATTACHMENTS_ID,
        ID.unique(),
        {
          workspaceId: task.workspaceId,
          taskId,
          memberId: member.$id,
          fileId: stored.$id,
          name: file.name.slice(0, 255),
          mimeType: file.type ? file.type.slice(0, 100) : null,
          size: file.size,
        },
      );

      await logActivities(databases, task, member.$id, [
        { type: ActivityType.ATTACHMENT_ADDED, change: { to: attachment.name } },
      ]);

      return c.json({ data: attachment });
    },
  )
  .get("/:attachmentId/file", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const storage = c.get("storage");

    const attachment = await databases.getDocument<Attachment>(
      DATABASE_ID,
      ATTACHMENTS_ID,
      c.req.param("attachmentId"),
    );
    const { member } = await getTaskMember(databases, attachment.taskId, c.get("user").$id);
    if (!member) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const content = await storage.getFileView(IMAGES_BUCKET_ID, attachment.fileId);
    const inline = !c.req.query("download") && INLINE_TYPES.test(attachment.mimeType ?? "");

    return new Response(content, {
      headers: {
        "Content-Type": inline ? attachment.mimeType! : "application/octet-stream",
        "Content-Disposition": `${inline ? "inline" : "attachment"}; filename*=UTF-8''${encodeURIComponent(attachment.name)}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=3600",
      },
    });
  })
  .delete("/:attachmentId", sessionMiddleware, async (c) => {
    const databases = c.get("databases");
    const storage = c.get("storage");

    const attachment = await databases.getDocument<Attachment>(
      DATABASE_ID,
      ATTACHMENTS_ID,
      c.req.param("attachmentId"),
    );
    const { task, member } = await getTaskMember(databases, attachment.taskId, c.get("user").$id);

    if (!member || (member.$id !== attachment.memberId && member.role !== MemberRole.ADMIN)) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    await databases.deleteDocument(DATABASE_ID, ATTACHMENTS_ID, attachment.$id);
    await Promise.all([
      storage.deleteFile(IMAGES_BUCKET_ID, attachment.fileId).catch(() => null),
      logActivities(databases, task, member.$id, [
        { type: ActivityType.ATTACHMENT_REMOVED, change: { from: attachment.name } },
      ]),
    ]);

    return c.json({ data: { $id: attachment.$id, taskId: attachment.taskId } });
  });

export default app;
