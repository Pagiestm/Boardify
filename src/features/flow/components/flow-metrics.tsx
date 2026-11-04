"use client";

import { useState, useSyncExternalStore } from "react";
import { fr } from "date-fns/locale";
import { format, parseISO } from "date-fns";
import { ActivityIcon, ChevronDownIcon, InfoIcon } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { COLUMN_COLOR_CONFIG } from "@/features/projects/constants";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ChartCard } from "@/components/charts/chart-card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { DurationStats } from "../metrics";
import { useFlowMetrics } from "../api/use-flow-metrics";

const AXIS = { fontSize: 11, fill: "var(--muted-foreground)" };
const PERIODS = [30, 60, 90];
const OPEN_KEY = "boardify-flow-open";
const HOUR = 60 * 60 * 1000;

/** Durée lisible : en heures sous une journée, en jours au-delà. */
export const formatDuration = (value: number | null) => {
  if (value === null) return "—";
  if (value < HOUR) return "< 1 h";
  if (value < 24 * HOUR) return `${Math.round(value / HOUR)} h`;
  const days = value / (24 * HOUR);
  return `${days.toLocaleString("fr-FR", { maximumFractionDigits: days < 10 ? 1 : 0 })} j`;
};

const subscribeNever = () => () => {};

const readOpen = () => {
  try {
    return localStorage.getItem(OPEN_KEY) === "1";
  } catch {
    return false;
  }
};

const Tile = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
  <div className="flex min-w-0 flex-col gap-1 rounded-lg border bg-card p-3 shadow-xs">
    <p className="truncate text-xs text-muted-foreground">{label}</p>
    <p className="text-xl font-semibold tabular-nums">{value}</p>
    {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
  </div>
);

const durationHint = (stats: DurationStats, empty: string) =>
  stats.count === 0
    ? empty
    : `${stats.count} tâche${stats.count > 1 ? "s" : ""} · 85 % en moins de ${formatDuration(stats.p85)}`;

const RulesHelp = () => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon-sm" aria-label="Comment sont calculés ces indicateurs">
        <InfoIcon />
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" collisionPadding={12} className="w-80 text-sm">
      <p className="font-medium">Comment sont calculés ces indicateurs</p>
      <ul className="mt-2 flex list-disc flex-col gap-1.5 pl-4 text-muted-foreground">
        <li>
          <span className="text-foreground">Temps de cycle</span> : du premier passage dans une
          colonne « en cours » au passage dans une colonne terminée.
        </li>
        <li>
          Colonnes « en attente » : la première colonne et « À faire » (avec celles qui la
          précèdent). Toutes les autres colonnes non terminées sont « en cours ».
        </li>
        <li>
          <span className="text-foreground">Temps de traversée</span> : de la création de la tâche à
          sa fin.
        </li>
        <li>
          <span className="text-foreground">Débit</span> : tâches terminées par semaine.
        </li>
        <li>
          <span className="text-foreground">Flux cumulé</span> : nombre de tâches dans chaque
          colonne, jour après jour. Une bande qui s&apos;épaissit signale un goulot.
        </li>
      </ul>
    </PopoverContent>
  </Popover>
);

interface CfdTooltipProps {
  active?: boolean;
  payload?: { dataKey?: string; value?: number; color?: string; payload?: { label: string } }[];
  labels: Record<string, string>;
}

const CfdTooltip = ({ active, payload, labels }: CfdTooltipProps) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
      <p className="font-medium text-popover-foreground">{payload[0].payload?.label}</p>
      {[...payload].reverse().map((entry) => (
        <p key={entry.dataKey} className="flex items-center gap-1.5 text-muted-foreground">
          <span aria-hidden className="size-2 rounded-full" style={{ background: entry.color }} />
          {labels[entry.dataKey ?? ""]} : {entry.value}
        </p>
      ))}
    </div>
  );
};

interface FlowMetricsProps {
  projectId: string;
  /** Sprint sélectionné : la période devient celle du sprint. */
  sprintId?: string | null;
  sprintName?: string;
}

/** Indicateurs de flux d'un projet, repliables pour ne pas alourdir la page. */
export const FlowMetrics = ({ projectId, sprintId, sprintName }: FlowMetricsProps) => {
  // Préférence retenue dans le navigateur ; fermé pendant le rendu serveur.
  const stored = useSyncExternalStore(subscribeNever, readOpen, () => false);
  const [choice, setChoice] = useState<boolean | null>(null);
  const open = choice ?? stored;
  const [days, setDays] = useState(30);

  const toggle = () => {
    const next = !open;
    try {
      localStorage.setItem(OPEN_KEY, next ? "1" : "0");
    } catch {
      // Préférence non retenue : le panneau reste utilisable.
    }
    setChoice(next);
  };

  const { data, isLoading } = useFlowMetrics({ projectId, sprintId, days, enabled: open });

  const visibleColumns =
    data?.columns.filter((column) =>
      data.cumulativeFlow.some((day) => (day.counts[column.id] ?? 0) > 0),
    ) ?? [];
  const labels = Object.fromEntries(visibleColumns.map((column) => [column.id, column.label]));
  const cfd =
    data?.cumulativeFlow.map((day) => ({
      ...day.counts,
      day: format(parseISO(day.date), "d MMM", { locale: fr }),
      label: format(parseISO(day.date), "EEEE d MMMM", { locale: fr }),
    })) ?? [];
  const throughput =
    data?.throughput.map((week) => ({
      count: week.count,
      week: format(parseISO(week.week), "d MMM", { locale: fr }),
      label: `Semaine du ${format(parseISO(week.week), "d MMMM", { locale: fr })}`,
    })) ?? [];
  const weeklyAverage = throughput.length
    ? throughput.reduce((sum, week) => sum + week.count, 0) / throughput.length
    : 0;

  return (
    <section className="rounded-lg border bg-card shadow-xs" aria-labelledby="flow-metrics-title">
      <div className="flex flex-wrap items-center gap-2 p-2 pl-4">
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 py-1.5 text-left"
        >
          <ActivityIcon className="size-4 shrink-0 text-muted-foreground" />
          <span id="flow-metrics-title" className="truncate text-sm font-medium">
            Indicateurs de flux
          </span>
          <span className="hidden truncate text-xs text-muted-foreground sm:inline">
            {sprintId && sprintName ? `· ${sprintName}` : "· temps de cycle, débit, flux cumulé"}
          </span>
          <ChevronDownIcon
            className={cn(
              "ml-auto size-4 shrink-0 text-muted-foreground transition-transform",
              open && "rotate-180",
            )}
          />
        </button>
        {open && (
          <div className="flex items-center gap-1">
            {!sprintId && (
              <Select value={String(days)} onValueChange={(value) => setDays(Number(value))}>
                <SelectTrigger className="h-8 w-40 text-[13px]" aria-label="Période">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERIODS.map((period) => (
                    <SelectItem key={period} value={String(period)}>
                      {period} derniers jours
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <RulesHelp />
          </div>
        )}
      </div>

      {open && (
        <div className="flex flex-col gap-3 border-t p-4">
          {isLoading || !data ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Tile
                  label="Temps de cycle (médiane)"
                  value={formatDuration(data.cycleTime.median)}
                  hint={durationHint(
                    data.cycleTime,
                    data.completed === 0
                      ? "Aucune tâche terminée sur la période"
                      : "Aucune tâche passée par une colonne « en cours »",
                  )}
                />
                <Tile
                  label="Temps de traversée (médiane)"
                  value={formatDuration(data.leadTime.median)}
                  hint={durationHint(data.leadTime, "Aucune tâche terminée sur la période")}
                />
                <Tile
                  label="Débit"
                  value={`${weeklyAverage.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} / sem.`}
                  hint={`${data.completed} tâche${data.completed > 1 ? "s" : ""} terminée${data.completed > 1 ? "s" : ""} sur la période`}
                />
              </div>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <ChartCard
                  title="Flux cumulé"
                  description="Tâches dans chaque colonne, jour après jour"
                  isEmpty={visibleColumns.length === 0}
                  emptyLabel="Aucune tâche sur la période"
                  className="p-4 shadow-none"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {visibleColumns.map((column) => (
                      <span key={column.id} className="flex items-center gap-1.5">
                        <span
                          aria-hidden
                          className={cn(
                            "size-2 rounded-full",
                            COLUMN_COLOR_CONFIG[column.color].dot,
                          )}
                        />
                        {column.label}
                      </span>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={cfd} margin={{ top: 4, right: 8, bottom: 0, left: -24 }}>
                      <CartesianGrid
                        stroke="var(--border)"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="day"
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={28}
                        tick={AXIS}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        tick={AXIS}
                      />
                      <Tooltip
                        content={<CfdTooltip labels={labels} />}
                        cursor={{ stroke: "var(--border)" }}
                      />
                      {/* Dernières colonnes en bas : les tâches terminées forment le socle. */}
                      {[...visibleColumns].reverse().map((column) => (
                        <Area
                          key={column.id}
                          type="monotone"
                          dataKey={column.id}
                          stackId="flow"
                          stroke={`var(--color-column-${column.color})`}
                          fill={`var(--color-column-${column.color})`}
                          fillOpacity={0.35}
                          strokeWidth={1.5}
                          isAnimationActive={false}
                        />
                      ))}
                    </AreaChart>
                  </ResponsiveContainer>
                </ChartCard>

                <ChartCard
                  title="Débit par semaine"
                  description="Tâches terminées"
                  isEmpty={data.completed === 0}
                  emptyLabel="Aucune tâche terminée sur la période"
                  className="p-4 shadow-none"
                >
                  <ResponsiveContainer width="100%" height={224}>
                    <BarChart data={throughput} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
                      <CartesianGrid
                        stroke="var(--border)"
                        strokeDasharray="3 3"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="week"
                        tickLine={false}
                        axisLine={false}
                        interval="preserveStartEnd"
                        minTickGap={16}
                        tick={AXIS}
                      />
                      <YAxis
                        allowDecimals={false}
                        tickLine={false}
                        axisLine={false}
                        width={44}
                        tick={AXIS}
                      />
                      <Tooltip
                        cursor={{ fill: "var(--muted)" }}
                        content={({ active, payload }) =>
                          active && payload?.length ? (
                            <div className="rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md">
                              <p className="font-medium text-popover-foreground">
                                {(payload[0].payload as { label: string }).label}
                              </p>
                              <p className="text-muted-foreground">
                                {payload[0].value} tâche{Number(payload[0].value) > 1 ? "s" : ""}
                              </p>
                            </div>
                          ) : null
                        }
                      />
                      <Bar
                        dataKey="count"
                        fill="var(--primary)"
                        radius={[4, 4, 0, 0]}
                        maxBarSize={32}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartCard>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
};
