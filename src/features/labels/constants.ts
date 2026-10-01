import { LabelColor } from "./types";

export const LABEL_COLOR_CONFIG: Record<LabelColor, { label: string; dot: string; badge: string }> =
  {
    teal: {
      label: "Turquoise",
      dot: "bg-teal-500",
      badge: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
    },
    blue: {
      label: "Bleu",
      dot: "bg-blue-500",
      badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    },
    amber: {
      label: "Ambre",
      dot: "bg-amber-500",
      badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    },
    violet: {
      label: "Violet",
      dot: "bg-violet-500",
      badge: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    },
    green: {
      label: "Vert",
      dot: "bg-green-500",
      badge: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
    },
    rose: {
      label: "Rose",
      dot: "bg-rose-500",
      badge: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300",
    },
  };
