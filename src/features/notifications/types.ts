import { Models } from "node-appwrite";

export enum NotificationType {
  ASSIGNED = "assigned",
  MENTIONED = "mentioned",
  COMMENTED = "commented",
  DUE_SOON = "due_soon",
}

export type Notification = Models.Document & {
  workspaceId: string;
  userId: string;
  taskId: string;
  actorId?: string | null;
  type: NotificationType;
  read?: boolean;
};
