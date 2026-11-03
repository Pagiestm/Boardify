import type { BaseDocument } from "@/lib/db/types";

export type Project = BaseDocument & {
  name: string;
  imageUrl: string;
  workspaceId: string;
  columnConfig?: string;
  githubRepo?: string | null;
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
