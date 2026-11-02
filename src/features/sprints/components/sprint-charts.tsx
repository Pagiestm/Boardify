"use client";

import { fr } from "date-fns/locale";
import { format, parseISO } from "date-fns";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/charts/chart-card";

import { Sprint, SprintStats } from "../types";
import { useSprintBurndown } from "../api/use-sprints";

const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" };

const unitLabel = (value: number, unit: "points" | "tasks") =>
  unit === "points"
    ? `${value} point${value > 1 ? "s" : ""}`
    : `${value} tâche${value > 1 ? "s" : ""}`;

interface BurndownTooltipProps {
  active?: boolean;
  payload?: { dataKey?: string; value?: number | null; payload?: { label: string } }[];
  unit: "points" | "tasks";
}

const BurndownTooltip = ({ active, payload, unit }: BurndownTooltipProps) => {
  if (!active || !payload?.length) return null;
  const remaining = payload.find((entry) => entry.dataKey === "remaining")?.value;
  const ideal = payload.find((entry) => entry.dataKey === "ideal")?.value;

  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{payload[0].payload?.label}</p>
      {remaining != null && (
        <p className="text-popover-foreground">Restant : {unitLabel(remaining, unit)}</p>
      )}
      {ideal != null && (
        <p className="text-muted-foreground">Rythme idéal : {unitLabel(ideal, unit)}</p>
      )}
    </div>
  );
};

/** Travail restant jour après jour, comparé au rythme régulier pour finir à temps. */
export const SprintBurndown = ({ sprintId }: { sprintId: string }) => {
  const { data, isLoading } = useSprintBurndown(sprintId);

  const points =
    data?.days.map((day) => ({
      ...day,
      day: format(parseISO(day.date), "d MMM", { locale: fr }),
      label: format(parseISO(day.date), "EEEE d MMMM", { locale: fr }),
    })) ?? [];
  const today = [...points].reverse().find((day) => day.remaining !== null);

  return (
    <ChartCard
      title="Avancement du sprint"
      description={
        data && today
          ? `Reste ${unitLabel(today.remaining ?? 0, data.unit)} sur ${unitLabel(data.total, data.unit)}`
          : undefined
      }
      isEmpty={!isLoading && (!data || data.total === 0)}
      emptyLabel="Ajoutez des tâches au sprint pour suivre son avancement"
      className="p-4 shadow-none"
    >
      <div className="mb-2 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="h-0.5 w-4 rounded-full bg-primary" />
          Restant
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="w-4 border-t-2 border-dashed border-muted-foreground/60" />
          Rythme idéal
        </span>
      </div>
      <ResponsiveContainer width="100%" height={160}>
        <LineChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
            minTickGap={24}
            tick={AXIS}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} tick={AXIS} />
          <Tooltip
            content={<BurndownTooltip unit={data?.unit ?? "tasks"} />}
            cursor={{ stroke: "var(--border)" }}
          />
          <Line
            type="linear"
            dataKey="ideal"
            stroke="var(--muted-foreground)"
            strokeOpacity={0.6}
            strokeWidth={1.5}
            strokeDasharray="4 4"
            dot={false}
            activeDot={false}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="remaining"
            stroke="var(--primary)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};

const MAX_SPRINTS = 6;

type SprintWithStats = Sprint & { stats: SprintStats };

interface VelocityTooltipProps {
  active?: boolean;
  payload?: { value?: number; payload?: { label: string } }[];
  unit: "points" | "tasks";
}

const VelocityTooltip = ({ active, payload, unit }: VelocityTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{payload[0].payload?.label}</p>
      <p className="text-muted-foreground">{unitLabel(payload[0].value ?? 0, unit)} livrés</p>
    </div>
  );
};

/** Travail livré par sprint terminé : le rythme réel de l'équipe. */
export const SprintVelocity = ({ sprints }: { sprints: SprintWithStats[] }) => {
  const completed = sprints.filter((sprint) => sprint.completed).slice(-MAX_SPRINTS);
  const unit = completed.some((sprint) => sprint.stats.points > 0) ? "points" : "tasks";
  const data = completed.map((sprint) => ({
    name: sprint.name,
    label: sprint.name,
    value: unit === "points" ? sprint.stats.donePoints : sprint.stats.doneTasks,
  }));
  const average = data.length
    ? Math.round((data.reduce((sum, entry) => sum + entry.value, 0) / data.length) * 10) / 10
    : 0;

  return (
    <ChartCard
      title="Vélocité"
      description={data.length ? `En moyenne ${unitLabel(average, unit)} par sprint` : undefined}
      isEmpty={data.length === 0}
      emptyLabel="Terminez un premier sprint pour voir la vélocité de l'équipe"
      className="p-4 shadow-none"
    >
      <ResponsiveContainer width="100%" height={184}>
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -24 }} barGap={2}>
          <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="name"
            tickLine={false}
            axisLine={false}
            interval={0}
            tick={AXIS}
            tickFormatter={(value: string) => (value.length > 10 ? `${value.slice(0, 9)}…` : value)}
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} width={44} tick={AXIS} />
          <Tooltip content={<VelocityTooltip unit={unit} />} cursor={{ fill: "var(--muted)" }} />
          <Bar dataKey="value" fill="var(--primary)" radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
};
