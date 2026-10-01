"use client";

import { PopulatedTask, TaskStatus } from "@/features/tasks/types";

import { ChartCard } from "./chart-card";

const MAX_ROWS = 6;

interface WorkloadBarsProps {
  tasks: PopulatedTask[];
}

export const WorkloadBars = ({ tasks }: WorkloadBarsProps) => {
  const open = tasks.filter((task) => task.status !== TaskStatus.DONE);

  const byAssignee = new Map<string, number>();
  for (const task of open) {
    const name = task.assignee?.name ?? task.assignee?.email ?? "Non assignée";
    byAssignee.set(name, (byAssignee.get(name) ?? 0) + 1);
  }

  const sorted = [...byAssignee.entries()]
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
      title="Charge par personne"
      description={open.length > 0 ? "Tâches non terminées" : undefined}
      isEmpty={open.length === 0}
      emptyLabel="Aucune tâche en cours"
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
                className="block h-full rounded-[2px] bg-[var(--color-column-blue)] transition-[width] duration-300"
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
