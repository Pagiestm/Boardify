import { TaskStatus } from "@/features/tasks/types";

import { ColumnColor } from "./types";

export const COLUMN_COLOR_CONFIG: Record<
  ColumnColor,
  { label: string; dot: string; border: string }
> = {
  teal: { label: "Turquoise", dot: "bg-teal-500", border: "border-l-teal-500" },
  blue: { label: "Bleu", dot: "bg-blue-500", border: "border-l-blue-500" },
  amber: { label: "Ambre", dot: "bg-amber-500", border: "border-l-amber-500" },
  violet: { label: "Violet", dot: "bg-violet-500", border: "border-l-violet-500" },
  green: { label: "Vert", dot: "bg-green-500", border: "border-l-green-500" },
  rose: { label: "Rose", dot: "bg-rose-500", border: "border-l-rose-500" },
  zinc: { label: "Gris", dot: "bg-zinc-400", border: "border-l-zinc-400" },
};

export const DEFAULT_COLUMN_COLORS: Record<TaskStatus, ColumnColor> = {
  [TaskStatus.BACKLOG]: "teal",
  [TaskStatus.TODO]: "blue",
  [TaskStatus.IN_PROGRESS]: "amber",
  [TaskStatus.IN_REVIEW]: "violet",
  [TaskStatus.DONE]: "green",
};
