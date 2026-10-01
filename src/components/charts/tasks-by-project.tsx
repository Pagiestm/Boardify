"use client";

import { PopulatedTask } from "@/features/tasks/types";

import { ChartCard } from "./chart-card";

const MAX_ROWS = 6;

interface TasksByProjectProps {
  tasks: PopulatedTask[];
}

export const TasksByProject = ({ tasks }: TasksByProjectProps) => {
  const counts = new Map<string, number>();

  for (const task of tasks) {
    const name = task.project?.name ?? "Sans projet";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const sorted = [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const rows = sorted.slice(0, MAX_ROWS);
  const rest = sorted.slice(MAX_ROWS);
  if (rest.length > 0) {
    rows.push({
      name: `${rest.length} autre${rest.length > 1 ? "s" : ""}`,
      count: rest.reduce((sum, entry) => sum + entry.count, 0),
    });
  }

  const max = Math.max(...rows.map((row) => row.count), 1);

  return (
    <ChartCard
      title="Tâches par projet"
      description={tasks.length > 0 ? "Où se concentre le travail" : undefined}
      isEmpty={tasks.length === 0}
      emptyLabel="Aucune tâche pour le moment"
    >
      <ul className="flex flex-col gap-3">
        {rows.map((row) => (
          <li key={row.name} className="grid grid-cols-[7rem_1fr_2rem] items-center gap-3">
            <span className="truncate text-xs text-muted-foreground" title={row.name}>
              {row.name}
            </span>
            <span className="h-2.5 w-full overflow-hidden rounded-[2px] bg-muted">
              <span
                title={`${row.name} : ${row.count}`}
                style={{ width: `${(row.count / max) * 100}%` }}
                className="block h-full rounded-[2px] bg-[var(--color-column-teal)] transition-[width] duration-300"
              />
            </span>
            <span className="text-right text-xs font-medium text-foreground tabular-nums">
              {row.count}
            </span>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
};
