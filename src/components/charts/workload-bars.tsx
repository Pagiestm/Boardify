"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PopulatedTask } from "@/features/tasks/types";

import { ChartCard } from "./chart-card";
import { ChartTooltip } from "./chart-tooltip";

const MAX_BARS = 6;

interface WorkloadBarsProps {
  tasks: PopulatedTask[];
}

export const WorkloadBars = ({ tasks }: WorkloadBarsProps) => {
  const counts = new Map<string, number>();

  for (const task of tasks) {
    const name = task.assignee?.name ?? task.assignee?.email ?? "Non assignée";
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }

  const sorted = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);

  const data = sorted.slice(0, MAX_BARS);
  const rest = sorted.slice(MAX_BARS);
  if (rest.length > 0) {
    data.push({
      label: `${rest.length} autre${rest.length > 1 ? "s" : ""}`,
      count: rest.reduce((sum, entry) => sum + entry.count, 0),
    });
  }

  const chartData = data.map((entry) => ({
    ...entry,
    short: entry.label.length > 12 ? `${entry.label.slice(0, 11)}…` : entry.label,
  }));

  return (
    <ChartCard
      title="Charge par personne"
      description={tasks.length > 0 ? "Tâches assignées" : undefined}
      isEmpty={tasks.length === 0}
      emptyLabel="Aucune tâche assignée"
    >
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="short"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ fill: "var(--muted)" }} />
          <Bar
            dataKey="count"
            fill="var(--color-column-violet)"
            radius={[4, 4, 0, 0]}
            maxBarSize={48}
          />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
