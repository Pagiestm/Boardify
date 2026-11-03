import "server-only";

import { eachDayOfInterval, endOfDay, format, min, startOfDay } from "date-fns";

import type { Db } from "@/lib/db";
import { Task } from "@/features/tasks/types";
import { Project } from "@/features/projects/types";
import { isDoneStatus } from "@/features/tasks/server/done";
import { Activity, ActivityChange, ActivityType } from "@/features/activities/types";

import { Sprint } from "../types";

export interface BurndownDay {
  date: string;
  /** Travail restant à la fin de la journée ; absent pour les jours à venir. */
  remaining: number | null;
  /** Rythme régulier pour finir à temps. */
  ideal: number;
}

const listCompletionActivities = async (db: Db, taskIds: string[]) => {
  const activities: Activity[] = [];
  for (let index = 0; index < taskIds.length; index += 100) {
    const { documents } = await db.activities.list({
      where: {
        taskId: taskIds.slice(index, index + 100),
        type: [ActivityType.STATUS, ActivityType.GITHUB_CLOSED],
      },
      limit: 5000,
    });
    activities.push(...documents);
  }
  return activities;
};

interface BurndownInput {
  sprint: Pick<Sprint, "startDate" | "endDate">;
  project: Project;
  tasks: Task[];
  activities: Activity[];
  now?: Date;
}

/**
 * Courbe d'avancement d'un sprint : travail restant jour après jour (en points si les tâches
 * sont estimées, sinon en nombre de tâches), à partir du moment où chaque tâche a été terminée.
 */
export const buildBurndown = ({
  sprint,
  project,
  tasks,
  activities,
  now = new Date(),
}: BurndownInput) => {
  const usePoints = tasks.some((task) => (task.estimate ?? 0) > 0);
  const weight = (task: Task) => (usePoints ? (task.estimate ?? 0) : 1);
  const total = tasks.reduce((sum, task) => sum + weight(task), 0);
  const doneTasks = tasks.filter((task) => isDoneStatus(project, task.status));
  const doneIds = new Set(doneTasks.map((task) => task.$id));

  // Moment où la tâche est passée pour la dernière fois dans une colonne « terminé ».
  const completedAt = new Map<string, Date>();
  for (const activity of activities) {
    if (!doneIds.has(activity.taskId)) continue;
    let finished = activity.type === ActivityType.GITHUB_CLOSED;
    if (activity.type === ActivityType.STATUS && activity.data) {
      try {
        const change = JSON.parse(activity.data) as ActivityChange;
        finished = typeof change.to === "string" && isDoneStatus(project, change.to);
      } catch {
        finished = false;
      }
    }
    if (!finished) continue;
    const date = new Date(activity.$createdAt);
    const previous = completedAt.get(activity.taskId);
    if (!previous || date > previous) completedAt.set(activity.taskId, date);
  }
  for (const task of doneTasks) {
    if (!completedAt.has(task.$id)) completedAt.set(task.$id, new Date(task.$updatedAt));
  }

  const start = startOfDay(new Date(sprint.startDate));
  const end = startOfDay(new Date(sprint.endDate));
  const days = end >= start ? eachDayOfInterval({ start, end }) : [start];
  const lastKnown = min([end, startOfDay(now)]);
  const span = Math.max(days.length - 1, 1);

  const series: BurndownDay[] = days.map((day, index) => {
    const dayEnd = endOfDay(day);
    const done = doneTasks
      .filter((task) => (completedAt.get(task.$id) ?? now) <= dayEnd)
      .reduce((sum, task) => sum + weight(task), 0);
    return {
      date: format(day, "yyyy-MM-dd"),
      remaining: day <= lastKnown ? total - done : null,
      ideal: Math.round(total * (1 - index / span) * 10) / 10,
    };
  });

  return { unit: usePoints ? ("points" as const) : ("tasks" as const), total, days: series };
};

export const computeBurndown = async (
  db: Db,
  sprint: Sprint,
  project: Project,
  tasks: Task[],
  now = new Date(),
) => {
  const doneTasks = tasks.filter((task) => isDoneStatus(project, task.status));
  const activities = await listCompletionActivities(
    db,
    doneTasks.map((task) => task.$id),
  );
  return buildBurndown({ sprint, project, tasks, activities, now });
};
