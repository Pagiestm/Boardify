"use client";

import { isPast, isToday, isWithinInterval, addDays, startOfDay } from "date-fns";
import { AlertTriangleIcon, CalendarClockIcon, CalendarDaysIcon, CalendarIcon } from "lucide-react";

import { PopulatedTask } from "@/features/tasks/types";

import { cn } from "@/lib/utils";

import { ChartCard } from "./chart-card";

const BUCKETS = [
  { id: "overdue", label: "En retard", fill: "var(--color-due-overdue)", icon: AlertTriangleIcon },
  { id: "today", label: "Aujourd'hui", fill: "var(--color-due-today)", icon: CalendarClockIcon },
  { id: "week", label: "7 prochains jours", fill: "var(--color-due-week)", icon: CalendarDaysIcon },
  { id: "later", label: "Plus tard", fill: "var(--color-due-later)", icon: CalendarIcon },
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

  const total = dated.length;
  const segments = BUCKETS.map((bucket) => ({
    ...bucket,
    count: counts.get(bucket.id) ?? 0,
  })).filter((segment) => segment.count > 0);

  return (
    <ChartCard
      title="Échéances"
      description={
        total > 0 ? `${total} tâche${total > 1 ? "s" : ""} datée${total > 1 ? "s" : ""}` : undefined
      }
      isEmpty={total === 0}
      emptyLabel="Aucune échéance pour le moment"
    >
      <div
        role="img"
        aria-label={`Échéances : ${segments.map((s) => `${s.label} ${s.count}`).join(", ")}`}
        className="flex h-3 w-full gap-0.5 overflow-hidden"
      >
        {segments.map((segment) => (
          <div
            key={segment.id}
            title={`${segment.label} : ${segment.count}`}
            style={{
              width: `${(segment.count / total) * 100}%`,
              backgroundColor: segment.fill,
            }}
            className="h-full rounded-[2px] transition-[width] duration-300"
          />
        ))}
      </div>

      <ul className="mt-4 grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2">
        {segments.map((segment) => (
          <li key={segment.id} className="flex items-center gap-2 text-xs">
            <segment.icon aria-hidden className="size-3.5 shrink-0 text-muted-foreground" />
            <span
              aria-hidden
              style={{ backgroundColor: segment.fill }}
              className={cn("size-2 shrink-0 rounded-[2px]")}
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
