import type { BaseDocument } from "@/lib/db/types";

/** Rappel personnel sur une tâche, transformé en notification à l'heure prévue. */
export type Reminder = BaseDocument & {
  workspaceId: string;
  taskId: string;
  userId: string;
  remindAt: string;
  sent?: boolean;
};
