import { Models } from "node-appwrite";

export type ChecklistItem = Models.Document & {
  workspaceId: string;
  taskId: string;
  title: string;
  done?: boolean;
  position: number;
};
