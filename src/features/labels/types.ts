import type { BaseDocument } from "@/lib/db/types";

export type Label = BaseDocument & {
  name: string;
  color: LabelColor;
  workspaceId: string;
};

export const LABEL_COLORS = ["teal", "blue", "amber", "violet", "green", "rose"] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];
