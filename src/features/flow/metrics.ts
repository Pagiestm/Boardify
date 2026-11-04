import {
  addWeeks,
  eachDayOfInterval,
  endOfDay,
  format,
  min,
  startOfDay,
  startOfISOWeek,
} from "date-fns";

import type { BoardColumn } from "@/features/projects/types";
import { Activity, ActivityChange, ActivityType } from "@/features/activities/types";

/**
 * Indicateurs de flux d'un projet, calculés à partir de l'historique des statuts.
 *
 * Règles :
 * - colonnes « en attente » : la première colonne et, si le projet a une colonne « À faire »
 *   (TODO), celle-ci et toutes celles qui la précèdent ;
 * - colonnes « en cours » : toutes les autres colonnes non terminées (une colonne supprimée
 *   depuis compte comme « en cours ») ;
 * - début du travail : premier passage dans une colonne « en cours » (ou la création, si la
 *   tâche était déjà « en cours » avant son premier changement de statut) ;
 * - fin : dernier passage dans une colonne terminée (ou fermeture de l'issue GitHub liée) ;
 *   à défaut d'historique, la dernière modification de la tâche ;
 * - temps de cycle : début du travail → fin ; temps de traversée : création → fin.
 */

export interface FlowTask {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  status: string;
}

export interface FlowPeriod {
  start: Date;
  end: Date;
}

export interface DurationStats {
  /** Nombre de tâches mesurées. */
  count: number;
  /** Durées en millisecondes ; null sans tâche mesurée. */
  median: number | null;
  average: number | null;
  /** 85 % des tâches ont été traitées en moins de ce temps. */
  p85: number | null;
}

export interface ThroughputWeek {
  /** Lundi de la semaine (AAAA-MM-JJ). */
  week: string;
  count: number;
}

export interface CumulativeFlowDay {
  date: string;
  /** Nombre de tâches par colonne à la fin de la journée. */
  counts: Record<string, number>;
}

export interface FlowMetrics {
  columns: Pick<BoardColumn, "id" | "label" | "color" | "done">[];
  period: { start: string; end: string };
  /** Tâches terminées pendant la période. */
  completed: number;
  cycleTime: DurationStats;
  leadTime: DurationStats;
  throughput: ThroughputWeek[];
  cumulativeFlow: CumulativeFlowDay[];
}

interface Transition {
  at: Date;
  from: string | null;
  to: string;
}

const MAX_DAYS = 120;

/** Colonnes d'attente : la première, et « À faire » avec celles qui la précèdent. */
export const waitingColumnIds = (columns: BoardColumn[]) => {
  const todo = columns.findIndex((column) => column.id === "TODO");
  const last = Math.max(0, todo);
  return new Set(columns.slice(0, last + 1).map((column) => column.id));
};

const statusOf = (value: unknown) => (typeof value === "string" && value ? value : null);

/** Changements de statut de chaque tâche, dans l'ordre chronologique. */
export const buildTransitions = (activities: Activity[], columns: BoardColumn[]) => {
  const firstDone = columns.find((column) => column.done)?.id ?? "DONE";
  const firstOpen = columns.find((column) => !column.done && !column.hidden)?.id ?? columns[0]?.id;
  const transitions = new Map<string, Transition[]>();

  for (const activity of activities) {
    let transition: Transition | null = null;
    const at = new Date(activity.$createdAt);

    if (activity.type === ActivityType.STATUS && activity.data) {
      try {
        const change = JSON.parse(activity.data) as ActivityChange;
        const to = statusOf(change.to);
        if (to) transition = { at, from: statusOf(change.from), to };
      } catch {
        transition = null;
      }
    } else if (activity.type === ActivityType.GITHUB_CLOSED) {
      // L'issue fermée sur GitHub range la tâche dans la première colonne terminée.
      transition = { at, from: null, to: firstDone };
    } else if (activity.type === ActivityType.GITHUB_REOPENED && firstOpen) {
      transition = { at, from: null, to: firstOpen };
    }

    if (!transition) continue;
    const list = transitions.get(activity.taskId) ?? [];
    list.push(transition);
    transitions.set(activity.taskId, list);
  }

  for (const list of transitions.values()) list.sort((a, b) => a.at.getTime() - b.at.getTime());
  return transitions;
};

const quantile = (sorted: number[], ratio: number) => {
  if (sorted.length === 0) return null;
  const position = (sorted.length - 1) * ratio;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
};

export const durationStats = (values: number[]): DurationStats => {
  const sorted = values.filter((value) => value >= 0).sort((a, b) => a - b);
  return {
    count: sorted.length,
    median: quantile(sorted, 0.5),
    average: sorted.length ? sorted.reduce((sum, value) => sum + value, 0) / sorted.length : null,
    p85: quantile(sorted, 0.85),
  };
};

interface FlowInput {
  tasks: FlowTask[];
  activities: Activity[];
  columns: BoardColumn[];
  period: FlowPeriod;
  now?: Date;
}

export const buildFlowMetrics = ({
  tasks,
  activities,
  columns,
  period,
  now = new Date(),
}: FlowInput): FlowMetrics => {
  const byId = new Map(columns.map((column) => [column.id, column]));
  const waiting = waitingColumnIds(columns);
  const isDone = (status: string) => byId.get(status)?.done ?? status === "DONE";
  const isInProgress = (status: string) => !isDone(status) && !waiting.has(status);
  const transitions = buildTransitions(activities, columns);

  const periodStart = startOfDay(period.start);
  const periodEnd = min([period.end, now]);

  const cycleTimes: number[] = [];
  const leadTimes: number[] = [];
  const completions: Date[] = [];

  for (const task of tasks) {
    if (!isDone(task.status)) continue;
    const history = transitions.get(task.$id) ?? [];
    const createdAt = new Date(task.$createdAt);

    const finishes = history.filter((entry) => isDone(entry.to));
    const completedAt = finishes.length ? finishes.at(-1)!.at : new Date(task.$updatedAt);
    if (completedAt < periodStart || completedAt > periodEnd) continue;
    completions.push(completedAt);
    leadTimes.push(completedAt.getTime() - createdAt.getTime());

    const started = history.find((entry) => isInProgress(entry.to));
    const startedAt =
      history.length > 0 && history[0].from && isInProgress(history[0].from)
        ? createdAt
        : started?.at;
    if (startedAt && startedAt <= completedAt) {
      cycleTimes.push(completedAt.getTime() - startedAt.getTime());
    }
  }

  // Débit : tâches terminées par semaine (du lundi au dimanche).
  const throughput: ThroughputWeek[] = [];
  for (let week = startOfISOWeek(periodStart); week <= periodEnd; week = addWeeks(week, 1)) {
    const next = addWeeks(week, 1);
    throughput.push({
      week: format(week, "yyyy-MM-dd"),
      count: completions.filter((date) => date >= week && date < next).length,
    });
  }

  // Flux cumulé : statut de chaque tâche à la fin de chaque jour de la période.
  const firstDay = startOfDay(periodStart);
  const lastDay = startOfDay(periodEnd);
  const allDays = lastDay >= firstDay ? eachDayOfInterval({ start: firstDay, end: lastDay }) : [];
  const days = allDays.slice(-MAX_DAYS);
  const statusAt = (task: FlowTask, moment: Date) => {
    const history = transitions.get(task.$id) ?? [];
    let status: string | null = null;
    for (const entry of history) {
      if (entry.at > moment) break;
      status = entry.to;
    }
    if (status) return status;
    // Avant le premier changement : le statut de départ, sinon le statut actuel.
    return history[0]?.from ?? (history.length ? null : task.status);
  };

  const cumulativeFlow = days.map((day) => {
    const moment = min([endOfDay(day), now]);
    const counts: Record<string, number> = Object.fromEntries(
      columns.map((column) => [column.id, 0]),
    );
    for (const task of tasks) {
      if (new Date(task.$createdAt) > moment) continue;
      const status = statusAt(task, moment);
      if (status && status in counts) counts[status] += 1;
    }
    return { date: format(day, "yyyy-MM-dd"), counts };
  });

  return {
    columns: columns.map(({ id, label, color, done }) => ({ id, label, color, done })),
    period: { start: periodStart.toISOString(), end: periodEnd.toISOString() },
    completed: completions.length,
    cycleTime: durationStats(cycleTimes),
    leadTime: durationStats(leadTimes),
    throughput,
    cumulativeFlow,
  };
};
