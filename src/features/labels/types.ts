import { Models } from "node-appwrite";

export type Label = Models.Document & {
  name: string;
  color: LabelColor;
  workspaceId: string;
};

export const LABEL_COLORS = ["teal", "blue", "amber", "violet", "green", "rose"] as const;

export type LabelColor = (typeof LABEL_COLORS)[number];
