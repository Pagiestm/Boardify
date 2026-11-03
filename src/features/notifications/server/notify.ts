import "server-only";

import type { Db } from "@/lib/db";

import { NotificationType } from "../types";

interface NotifyOptions {
  workspaceId: string;
  taskId: string;
  type: NotificationType;
  actorId: string | null;
  recipientIds: (string | null | undefined)[];
}

export const notifyMembers = async (
  db: Db,
  { workspaceId, taskId, type, actorId, recipientIds }: NotifyOptions,
) => {
  const memberIds = [...new Set(recipientIds.filter((id): id is string => !!id && id !== actorId))];
  if (memberIds.length === 0) return;

  try {
    const { documents: members } = await db.members.list({
      where: { $id: memberIds, workspaceId },
      limit: 100,
    });

    await Promise.all(
      members.map((member) =>
        db.notifications.create({
          workspaceId,
          userId: member.userId,
          taskId,
          actorId,
          type,
          read: false,
        }),
      ),
    );
  } catch (error) {
    console.error("Envoi des notifications impossible", error);
  }
};
