import type { BaseDocument } from "@/lib/db/types";

export const RETRO_KINDS = ["good", "improve", "action"] as const;
export type RetroKind = (typeof RETRO_KINDS)[number];

/** Élément de rétrospective d'un sprint ; une action peut devenir une tâche. */
export type RetroItem = BaseDocument & {
  workspaceId: string;
  sprintId: string;
  memberId: string;
  kind: RetroKind;
  content: string;
  taskId?: string | null;
};
