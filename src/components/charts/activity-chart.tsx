"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { eachDayOfInterval, format, isSameDay, subDays } from "date-fns";
import { fr } from "date-fns/locale";

import { PopulatedTask } from "@/features/tasks/types";

import { ChartCard } from "./chart-card";
import { ChartTooltip } from "./chart-tooltip";

const DAYS = 30;

interface ActivityChartProps {
  tasks: PopulatedTask[];
}

export const ActivityChart = ({ tasks }: ActivityChartProps) => {
  const today = new Date();
  const days = eachDayOfInterval({ start: subDays(today, DAYS - 1), end: today });

  const data = days.map((day) => ({
    day: format(day, "d MMM", { locale: fr }),
    label: format(day, "EEEE d MMMM", { locale: fr }),
    count: tasks.filter((task) => isSameDay(new Date(task.$createdAt), day)).length,
  }));

  const total = data.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <ChartCard
      title="Activité"
      description={
        total > 0
          ? `${total} tâche${total > 1 ? "s" : ""} créée${total > 1 ? "s" : ""} sur 30 jours`
          : undefined
      }
      isEmpty={total === 0}
      emptyLabel="Aucune tâche créée ces 30 derniers jours"
    >
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id="activity-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--color-column-teal)" stopOpacity={0.35} />
              <stop offset="100%" stopColor="var(--color-column-teal)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={32}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            width={44}
            tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)" }} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--color-column-teal)"
            strokeWidth={2}
            fill="url(#activity-fill)"
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
