import type { BaseDocument } from "@/lib/db/types";

export enum NotificationType {
  ASSIGNED = "assigned",
  MENTIONED = "mentioned",
  COMMENTED = "commented",
  DUE_SOON = "due_soon",
}

export type Notification = BaseDocument & {
  workspaceId: string;
  userId: string;
  taskId: string;
  actorId?: string | null;
  type: NotificationType;
  read?: boolean;
};
