"use client";

import { useState } from "react";
import Link from "next/link";
import { fr } from "date-fns/locale";
import {
  addDays,
  addWeeks,
  differenceInCalendarWeeks,
  eachDayOfInterval,
  format,
  getISOWeek,
  isWeekend,
  max,
  startOfDay,
  startOfWeek,
} from "date-fns";

import { Member } from "@/features/members/types";
import { PopulatedTask } from "@/features/tasks/types";
import { isTaskDone } from "@/features/tasks/utils";
import { MemberAvatar } from "@/features/members/components/member-avatar";

import { cn } from "@/lib/utils";

import { ChartCard } from "./chart-card";

const WEEKS = 6;

type Unit = "points" | "tasks";

interface WorkloadTimelineProps {
  workspaceId: string;
  tasks: PopulatedTask[];
  members: Member[];
}

const formatValue = (value: number) =>
  value === 0 ? "" : Number.isInteger(value) ? String(value) : value.toFixed(1).replace(".", ",");

export const WorkloadTimeline = ({ workspaceId, tasks, members }: WorkloadTimelineProps) => {
  const openTasks = tasks.filter((task) => !isTaskDone(task) && task.dueDate);
  const hasEstimates = openTasks.some((task) => task.estimate != null);
  const [unit, setUnit] = useState<Unit>(hasEstimates ? "points" : "tasks");

  const today = startOfDay(new Date());
  const firstWeek = startOfWeek(today, { weekStartsOn: 1 });
  const weeks = Array.from({ length: WEEKS }, (_, index) => addWeeks(firstWeek, index));

  const rows = new Map(
    members.map((member) => [
      member.$id,
      { overdue: 0, weeks: Array<number>(WEEKS).fill(0), later: 0, tasks: 0 },
    ]),
  );

  let unestimated = 0;

  for (const task of openTasks) {
    const row = rows.get(task.assigneeId);
    if (!row) continue;

    const amount = unit === "points" ? (task.estimate ?? 0) : 1;
    if (unit === "points" && task.estimate == null) unestimated += 1;
    row.tasks += 1;

    const due = startOfDay(new Date(task.dueDate));
    if (due < today) {
      row.overdue += amount;
      continue;
    }

    const start = max([today, startOfDay(new Date(task.startDate ?? task.dueDate))]);
    const days = eachDayOfInterval({ start: start > due ? due : start, end: due });
    const workdays = days.filter((day) => !isWeekend(day));
    const spread = workdays.length > 0 ? workdays : [due];

    for (const day of spread) {
      const week = differenceInCalendarWeeks(day, firstWeek, { weekStartsOn: 1 });
      if (week < WEEKS) row.weeks[week] += amount / spread.length;
      else row.later += amount / spread.length;
    }
  }

  const peak = Math.max(1, ...[...rows.values()].flatMap((row) => row.weeks));
  const sortedMembers = [...members].sort(
    (a, b) => (rows.get(b.$id)?.tasks ?? 0) - (rows.get(a.$id)?.tasks ?? 0),
  );

  return (
    <ChartCard
      title="Charge des prochaines semaines"
      description={`Travail restant réparti sur les jours ouvrés jusqu'à l'échéance, en ${
        unit === "points" ? "points d'estimation" : "nombre de tâches"
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-md border p-0.5 text-xs">
          {(["points", "tasks"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={unit === value}
              onClick={() => setUnit(value)}
              className={cn(
                "rounded px-2.5 py-1 transition-colors",
                unit === value
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "points" ? "Points" : "Tâches"}
            </button>
          ))}
        </div>
        {unit === "points" && unestimated > 0 && (
          <p className="text-xs text-muted-foreground">
            {unestimated} tâche{unestimated > 1 ? "s" : ""} sans estimation non comptée
            {unestimated > 1 ? "s" : ""}
          </p>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-separate border-spacing-1 text-sm">
          <thead>
            <tr className="text-xs text-muted-foreground">
              <th className="w-44 px-1 text-left font-medium">Membre</th>
              <th className="px-1 font-medium">En retard</th>
              {weeks.map((week) => (
                <th key={week.toISOString()} className="px-1 font-medium whitespace-nowrap">
                  <span className="block text-foreground">S{getISOWeek(week)}</span>
                  <span className="block font-normal">
                    {format(week, "d MMM", { locale: fr })} –{" "}
                    {format(addDays(week, 4), "d", { locale: fr })}
                  </span>
                </th>
              ))}
              <th className="px-1 font-medium">Plus tard</th>
            </tr>
          </thead>
          <tbody>
            {sortedMembers.map((member) => {
              const row = rows.get(member.$id)!;
              const name = member.name ?? member.email ?? "Membre";

              return (
                <tr key={member.$id}>
                  <td className="px-1">
                    <Link
                      href={`/workspaces/${workspaceId}/tasks?assigneeId=${member.$id}`}
                      className="flex min-w-0 items-center gap-2 hover:underline"
                    >
                      <MemberAvatar
                        name={name}
                        className="size-6"
                        fallbackClassName="text-[10px]"
                      />
                      <span className="truncate">{name}</span>
                    </Link>
                  </td>
                  <td
                    className={cn(
                      "h-9 rounded-md text-center tabular-nums",
                      row.overdue > 0
                        ? "bg-red-500/10 font-medium text-red-600 dark:text-red-400"
                        : "bg-muted/40",
                    )}
                  >
                    {formatValue(row.overdue)}
                  </td>
                  {row.weeks.map((value, index) => {
                    const intensity = Math.round((value / peak) * 70);
                    return (
                      <td
                        key={index}
                        title={
                          value > 0
                            ? `${formatValue(value)} ${unit === "points" ? "pts" : "tâches"}`
                            : undefined
                        }
                        className={cn(
                          "h-9 rounded-md text-center tabular-nums",
                          value === 0 && "bg-muted/40",
                          intensity > 40 && "font-medium text-primary-foreground",
                        )}
                        style={
                          value > 0
                            ? {
                                background: `color-mix(in oklab, var(--primary) ${Math.max(
                                  intensity,
                                  10,
                                )}%, transparent)`,
                              }
                            : undefined
                        }
                      >
                        {formatValue(value)}
                      </td>
                    );
                  })}
                  <td className="h-9 rounded-md bg-muted/40 text-center text-muted-foreground tabular-nums">
                    {formatValue(row.later)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
};
