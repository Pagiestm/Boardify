import type { BaseDocument } from "@/lib/db/types";

/** Page de documentation d'un projet (Markdown), éventuellement liée à des tâches. */
export type ProjectDoc = BaseDocument & {
  workspaceId: string;
  projectId: string;
  title: string;
  content: string;
  createdBy: string;
  updatedBy?: string | null;
  taskIds?: string[];
};
