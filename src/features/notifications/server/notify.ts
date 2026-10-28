import "server-only";

import { ID, Query, type Databases } from "node-appwrite";

import { Member } from "@/features/members/types";

import { DATABASE_ID, MEMBERS_ID, NOTIFICATIONS_ID } from "@/config";

import { NotificationType } from "../types";

interface NotifyOptions {
  workspaceId: string;
  taskId: string;
  type: NotificationType;
  actorId: string | null;
  recipientIds: (string | null | undefined)[];
}

export const notifyMembers = async (
  databases: Databases,
  { workspaceId, taskId, type, actorId, recipientIds }: NotifyOptions,
) => {
  const memberIds = [...new Set(recipientIds.filter((id): id is string => !!id && id !== actorId))];
  if (memberIds.length === 0) return;

  try {
    const { documents: members } = await databases.listDocuments<Member>(DATABASE_ID, MEMBERS_ID, [
      Query.equal("$id", memberIds),
      Query.equal("workspaceId", workspaceId),
      Query.limit(100),
    ]);

    await Promise.all(
      members.map((member) =>
        databases.createDocument(DATABASE_ID, NOTIFICATIONS_ID, ID.unique(), {
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
