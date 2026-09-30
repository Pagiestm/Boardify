"use client";

import { PopulatedTask, TaskStatus } from "@/features/tasks/types";
import { TASK_STATUS_CONFIG, TASK_STATUS_ORDER } from "@/features/tasks/constants";

import { ChartCard } from "./chart-card";

const STATUS_FILL: Record<TaskStatus, string> = {
  [TaskStatus.BACKLOG]: "var(--color-chart-backlog)",
  [TaskStatus.TODO]: "var(--color-chart-todo)",
  [TaskStatus.IN_PROGRESS]: "var(--color-chart-in-progress)",
  [TaskStatus.IN_REVIEW]: "var(--color-chart-in-review)",
  [TaskStatus.DONE]: "var(--color-chart-done)",
};

interface StatusBreakdownProps {
  tasks: PopulatedTask[];
}

export const StatusBreakdown = ({ tasks }: StatusBreakdownProps) => {
  const total = tasks.length;

  const segments = TASK_STATUS_ORDER.map((status) => {
    const count = tasks.filter((task) => task.status === status).length;
    return {
      status,
      count,
      label: TASK_STATUS_CONFIG[status].label,
      share: total === 0 ? 0 : (count / total) * 100,
      fill: STATUS_FILL[status],
    };
  }).filter((segment) => segment.count > 0);

  return (
    <ChartCard
      title="Répartition par statut"
      description={total > 0 ? `${total} tâche${total > 1 ? "s" : ""} au total` : undefined}
      isEmpty={total === 0}
      emptyLabel="Aucune tâche pour le moment"
    >
      <div
        role="img"
        aria-label={`Répartition des tâches : ${segments
          .map((segment) => `${segment.label} ${segment.count}`)
          .join(", ")}`}
        className="flex h-3 w-full gap-0.5 overflow-hidden"
      >
        {segments.map((segment) => (
          <div
            key={segment.status}
            title={`${segment.label} : ${segment.count} (${Math.round(segment.share)} %)`}
            style={{ width: `${segment.share}%`, backgroundColor: segment.fill }}
            className="h-full rounded-[2px] transition-[width] duration-300"
          />
        ))}
      </div>

      <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
        {segments.map((segment) => (
          <li key={segment.status} className="flex items-center gap-2 text-xs">
            <span
              aria-hidden
              style={{ backgroundColor: segment.fill }}
              className="size-2 shrink-0 rounded-[2px]"
            />
            <span className="truncate text-muted-foreground">{segment.label}</span>
            <span className="ml-auto font-medium text-foreground tabular-nums">
              {segment.count}
            </span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
};
