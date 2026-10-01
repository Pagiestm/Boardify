"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { addDays, isPast, isToday, isWithinInterval, startOfDay } from "date-fns";

import { PopulatedTask } from "@/features/tasks/types";

import { ChartCard } from "./chart-card";
import { ChartTooltip } from "./chart-tooltip";

const BUCKETS = [
  { id: "overdue", label: "En retard", short: "Retard", fill: "var(--color-due-overdue)" },
  { id: "today", label: "Aujourd'hui", short: "Auj.", fill: "var(--color-due-today)" },
  { id: "week", label: "7 prochains jours", short: "7 j", fill: "var(--color-due-week)" },
  { id: "later", label: "Plus tard", short: "Plus tard", fill: "var(--color-due-later)" },
] as const;

type BucketId = (typeof BUCKETS)[number]["id"];

const bucketOf = (dueDate: Date): BucketId => {
  if (isToday(dueDate)) return "today";
  if (isPast(dueDate)) return "overdue";

  const today = startOfDay(new Date());
  if (isWithinInterval(dueDate, { start: today, end: addDays(today, 7) })) return "week";

  return "later";
};

interface DueDatesProps {
  tasks: PopulatedTask[];
}

export const DueDates = ({ tasks }: DueDatesProps) => {
  const dated = tasks.filter((task) => Boolean(task.dueDate));

  const counts = new Map<BucketId, number>();
  for (const task of dated) {
    const id = bucketOf(new Date(task.dueDate));
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  const data = BUCKETS.map((bucket) => ({
    short: bucket.short,
    label: bucket.label,
    fill: bucket.fill,
    count: counts.get(bucket.id) ?? 0,
  }));

  return (
    <ChartCard
      title="Échéances"
      description={
        dated.length > 0
          ? `${dated.length} tâche${dated.length > 1 ? "s" : ""} datée${dated.length > 1 ? "s" : ""}`
          : undefined
      }
      isEmpty={dated.length === 0}
      emptyLabel="Aucune échéance pour le moment"
    >
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
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
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((entry) => (
              <Cell key={entry.label} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
