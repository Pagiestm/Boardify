import { Models } from "node-appwrite";

export type Project = Models.Document & {
  name: string;
  imageUrl: string;
  workspaceId: string;
  columnConfig?: string;
};

export const COLUMN_COLORS = ["teal", "blue", "amber", "violet", "green", "rose", "zinc"] as const;

export type ColumnColor = (typeof COLUMN_COLORS)[number];

export interface BoardColumn {
  id: string;
  label: string;
  color: ColumnColor;
  hidden: boolean;
  done: boolean;
}
