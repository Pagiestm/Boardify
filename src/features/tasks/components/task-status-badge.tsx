import { COLUMN_COLOR_CONFIG } from "@/features/projects/constants";
import { BoardColumn } from "@/features/projects/types";

import { cn } from "@/lib/utils";

import { TASK_STATUS_CONFIG, TASK_STATUS_ORDER } from "../constants";
import { TaskStatus } from "../types";

const isDefaultStatus = (status: string): status is TaskStatus =>
  TASK_STATUS_ORDER.includes(status as TaskStatus);

export const resolveStatus = (status: string, column?: BoardColumn) => {
  if (column) {
    const config = COLUMN_COLOR_CONFIG[column.color];
    return { label: column.label, dot: config.dot, border: config.border };
  }

  if (isDefaultStatus(status)) {
    const config = TASK_STATUS_CONFIG[status];
    return { label: config.label, dot: config.dot, border: config.border };
  }

  return {
    label: status,
    dot: COLUMN_COLOR_CONFIG.zinc.dot,
    border: COLUMN_COLOR_CONFIG.zinc.border,
  };
};

interface TaskStatusBadgeProps {
  status: string;
  column?: BoardColumn;
  className?: string;
}

export const TaskStatusBadge = ({ status, column, className }: TaskStatusBadgeProps) => {
  const resolved = resolveStatus(status, column);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm px-1.5 py-0.5 text-xs font-medium",
        "bg-muted text-foreground",
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 shrink-0 rounded-full", resolved.dot)} />
      {resolved.label}
    </span>
  );
};
