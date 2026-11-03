import type { BaseDocument } from "@/lib/db/types";

export type ChecklistItem = BaseDocument & {
  workspaceId: string;
  taskId: string;
  title: string;
  done?: boolean;
  position: number;
};
