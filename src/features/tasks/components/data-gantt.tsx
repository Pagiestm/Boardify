"use client";

import { useRouter } from "next/navigation";
import {
  addDays,
  differenceInCalendarDays,
  format,
  isToday,
  isWeekend,
  max,
  min,
  startOfDay,
} from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangleIcon } from "lucide-react";

import { COLUMN_COLOR_CONFIG } from "@/features/projects/constants";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { cn } from "@/lib/utils";

import { PopulatedTask } from "../types";
import { isTaskDone } from "../utils";
import { resolveStatus } from "./task-status-badge";

const DAY_WIDTH = 32;
const LABEL_WIDTH = 220;
const MIN_DAYS = 14;
const ROW_HEIGHT = 41;
const ELBOW = 8;

interface DataGanttProps {
  data: PopulatedTask[];
}

export const DataGantt = ({ data }: DataGanttProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();
  const today = startOfDay(new Date());

  const rows = data
    .filter((task) => Boolean(task.dueDate))
    .map((task) => {
      const end = startOfDay(new Date(task.dueDate));
      const start = task.startDate ? startOfDay(new Date(task.startDate)) : end;
      const isDone = isTaskDone(task);

      return {
        task,
        start: min([start, end]),
        end,
        isDone,
        isOverdue: !isDone && end < today,
      };
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  if (rows.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed text-sm text-muted-foreground">
        Aucune tâche datée à placer sur la frise.
      </div>
    );
  }

  const first = min(rows.map((row) => row.start));
  const last = max(rows.map((row) => row.end));
  const spanDays = Math.max(differenceInCalendarDays(last, first) + 1, MIN_DAYS);
  const days = Array.from({ length: spanDays }, (_, index) => addDays(first, index));

  const todayOffset = differenceInCalendarDays(today, first);
  const showTodayLine = todayOffset >= 0 && todayOffset < spanDays;
  const overdueCount = rows.filter((row) => row.isOverdue).length;

  const rowIndex = new Map(rows.map((row, index) => [row.task.$id, index]));
  const links = rows.flatMap((row, targetIndex) =>
    (row.task.blockedBy ?? []).flatMap((blockerId) => {
      const sourceIndex = rowIndex.get(blockerId);
      if (sourceIndex === undefined) return [];
      const source = rows[sourceIndex];

      const sx = LABEL_WIDTH + (differenceInCalendarDays(source.end, first) + 1) * DAY_WIDTH - 4;
      const sy = sourceIndex * ROW_HEIGHT + 20;
      const tx = LABEL_WIDTH + differenceInCalendarDays(row.start, first) * DAY_WIDTH + 4;
      const ty = targetIndex * ROW_HEIGHT + 20;

      const path =
        tx - ELBOW >= sx + ELBOW
          ? `M ${sx} ${sy} H ${sx + ELBOW} V ${ty} H ${tx}`
          : `M ${sx} ${sy} H ${sx + ELBOW} V ${ty + (ty > sy ? -20 : 20)} H ${Math.max(tx - ELBOW * 1.5, LABEL_WIDTH + 1)} V ${ty} H ${tx}`;

      return [{ id: `${blockerId}-${row.task.$id}`, path, isOpen: !source.isDone && !row.isDone }];
    }),
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden className="h-2 w-5 rounded-full bg-muted-foreground/30" />
          Terminée
        </span>
        <span className="inline-flex items-center gap-1.5">
          <AlertTriangleIcon aria-hidden className="size-3.5 text-red-600 dark:text-red-400" />
          {overdueCount > 0
            ? `${overdueCount} tâche${overdueCount > 1 ? "s" : ""} en retard`
            : "Aucune tâche en retard"}
        </span>
        {links.length > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span aria-hidden className="h-px w-5 bg-amber-500" />
            Dépendance
          </span>
        )}
      </div>

      <div className="overflow-x-auto">
        <div className="relative" style={{ minWidth: LABEL_WIDTH + spanDays * DAY_WIDTH }}>
          <div className="flex border-b">
            <div
              style={{ width: LABEL_WIDTH }}
              className="shrink-0 px-2 pb-2 text-xs font-medium text-muted-foreground"
            >
              Tâche
            </div>
            <div className="flex">
              {days.map((day) => (
                <div
                  key={day.toISOString()}
                  style={{ width: DAY_WIDTH }}
                  className={cn(
                    "shrink-0 pb-2 text-center text-[11px] text-muted-foreground",
                    isWeekend(day) && "text-muted-foreground/60",
                    isToday(day) && "font-semibold text-foreground",
                  )}
                >
                  <span className="block">{format(day, "EEEEE", { locale: fr })}</span>
                  <span className="block tabular-nums">{format(day, "d")}</span>
                </div>
              ))}
            </div>
          </div>

          {showTodayLine && (
            <span
              aria-hidden
              style={{ left: LABEL_WIDTH + todayOffset * DAY_WIDTH + DAY_WIDTH / 2 }}
              className="pointer-events-none absolute inset-y-0 w-px bg-primary/40"
            />
          )}

          <div className="relative">
            <ul className="divide-y">
              {rows.map(({ task, start, end, isDone, isOverdue }) => {
                const offset = differenceInCalendarDays(start, first);
                const length = differenceInCalendarDays(end, start) + 1;
                const status = resolveStatus(task.status, task.statusColumn);
                const color = task.statusColumn
                  ? COLUMN_COLOR_CONFIG[task.statusColumn.color].dot
                  : status.dot;
                const period = `${format(start, "d MMM", { locale: fr })} → ${format(end, "d MMM", { locale: fr })}`;
                const lateBy = differenceInCalendarDays(today, end);

                return (
                  <li key={task.$id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => router.push(`/workspaces/${workspaceId}/tasks/${task.$id}`)}
                      style={{ width: LABEL_WIDTH }}
                      className="flex shrink-0 items-center gap-1.5 px-2 py-2 text-left text-sm transition-colors hover:text-primary"
                      title={task.name}
                    >
                      {isOverdue && (
                        <AlertTriangleIcon
                          aria-hidden
                          className="size-3.5 shrink-0 text-red-600 dark:text-red-400"
                        />
                      )}
                      <span
                        className={cn(
                          "truncate",
                          isDone && "text-muted-foreground line-through",
                          isOverdue && "text-red-600 dark:text-red-400",
                        )}
                      >
                        {task.name}
                      </span>
                      {isOverdue && <span className="sr-only">, en retard de {lateBy} j</span>}
                    </button>
                    <div className="relative flex h-10 items-center">
                      {days.map((day) => (
                        <div
                          key={day.toISOString()}
                          style={{ width: DAY_WIDTH }}
                          className={cn(
                            "h-full shrink-0 border-l border-border/50",
                            isWeekend(day) && "bg-muted/40",
                            isToday(day) && "bg-primary/5",
                          )}
                        />
                      ))}
                      <span
                        title={
                          isOverdue
                            ? `${status.label} · ${period} · en retard de ${lateBy} j`
                            : `${status.label} · ${period}${isDone ? " · terminée" : ""}`
                        }
                        style={{
                          left: offset * DAY_WIDTH + 4,
                          width: length * DAY_WIDTH - 8,
                        }}
                        className={cn(
                          "absolute h-3 rounded-full",
                          color,
                          isDone && "opacity-40",
                          isOverdue &&
                            "outline-2 outline-offset-1 outline-red-600 dark:outline-red-400",
                        )}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
            {links.length > 0 && (
              <svg
                aria-hidden
                className="pointer-events-none absolute inset-0 size-full overflow-visible"
              >
                <defs>
                  {(["open", "done"] as const).map((state) => (
                    <marker
                      key={state}
                      id={`gantt-arrow-${state}`}
                      viewBox="0 0 6 6"
                      refX="5"
                      refY="3"
                      markerWidth="6"
                      markerHeight="6"
                      orient="auto"
                    >
                      <path
                        d="M 0 0 L 6 3 L 0 6 z"
                        className={state === "open" ? "fill-amber-500" : "fill-muted-foreground/40"}
                      />
                    </marker>
                  ))}
                </defs>
                {links.map((link) => (
                  <path
                    key={link.id}
                    d={link.path}
                    fill="none"
                    strokeWidth={1.5}
                    markerEnd={`url(#gantt-arrow-${link.isOpen ? "open" : "done"})`}
                    className={cn(link.isOpen ? "stroke-amber-500" : "stroke-muted-foreground/40")}
                  />
                ))}
              </svg>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
