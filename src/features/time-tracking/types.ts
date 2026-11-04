import type { BaseDocument } from "@/lib/db/types";

/** Temps passé sur une tâche : chronomètre en cours tant que `endedAt` est vide. */
export type TimeEntry = BaseDocument & {
  workspaceId: string;
  taskId: string;
  memberId: string;
  startedAt: string;
  endedAt?: string | null;
  note?: string | null;
};
