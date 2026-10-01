import { TaskPriority, TaskStatus } from "./types";

interface StatusConfig {
  label: string;
  text: string;
  dot: string;
  badge: string;
  border: string;
}

export const TASK_STATUS_CONFIG: Record<TaskStatus, StatusConfig> = {
  [TaskStatus.BACKLOG]: {
    label: "Backlog",
    text: "text-teal-600 dark:text-teal-400",
    dot: "bg-teal-500",
    badge: "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
    border: "border-l-teal-500",
  },
  [TaskStatus.TODO]: {
    label: "À faire",
    text: "text-blue-600 dark:text-blue-400",
    dot: "bg-blue-500",
    badge: "bg-blue-50 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
    border: "border-l-blue-500",
  },
  [TaskStatus.IN_PROGRESS]: {
    label: "En cours",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    border: "border-l-amber-500",
  },
  [TaskStatus.IN_REVIEW]: {
    label: "En revue",
    text: "text-violet-600 dark:text-violet-400",
    dot: "bg-violet-500",
    badge: "bg-violet-50 text-violet-700 dark:bg-violet-500/15 dark:text-violet-300",
    border: "border-l-violet-500",
  },
  [TaskStatus.DONE]: {
    label: "Terminé",
    text: "text-green-600 dark:text-green-400",
    dot: "bg-green-500",
    badge: "bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300",
    border: "border-l-green-500",
  },
};

export const TASK_PRIORITY_CONFIG: Record<TaskPriority, StatusConfig> = {
  [TaskPriority.HIGH]: {
    label: "Haute",
    text: "text-red-600 dark:text-red-400",
    dot: "bg-red-500",
    badge: "bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300",
    border: "border-l-red-500",
  },
  [TaskPriority.MEDIUM]: {
    label: "Moyenne",
    text: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    badge: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
    border: "border-l-amber-500",
  },
  [TaskPriority.LOW]: {
    label: "Basse",
    text: "text-zinc-500",
    dot: "bg-zinc-400",
    badge: "bg-zinc-100 text-zinc-700 dark:bg-zinc-500/15 dark:text-zinc-300",
    border: "border-l-zinc-400",
  },
};

export const TASK_STATUS_ORDER: TaskStatus[] = [
  TaskStatus.BACKLOG,
  TaskStatus.TODO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.IN_REVIEW,
  TaskStatus.DONE,
];
