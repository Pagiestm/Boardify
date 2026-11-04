import { addDays, differenceInCalendarDays, startOfDay } from "date-fns";

import { Task } from "@/features/tasks/types";
import { isTaskDone } from "@/features/tasks/utils";
import { Project } from "@/features/projects/types";
import { parseBoardColumns } from "@/features/projects/utils";
import { getSprintState, Sprint, SprintState } from "@/features/sprints/types";

/**
 * Santé d'un projet :
 * - « en retard » : le sprint en cours a dépassé sa date de fin sans être clôturé, ou au moins
 *   3 tâches ouvertes (et au moins un quart d'entre elles) ont dépassé leur échéance ;
 * - « à surveiller » : au moins une tâche en retard, ou un sprint en cours qui avance nettement
 *   moins vite que le temps écoulé (plus de 25 points d'écart) ;
 * - « en bonne voie » sinon ; « terminé » quand toutes les tâches le sont, « vide » sans tâche.
 */
export type ProjectHealth = "off-track" | "at-risk" | "on-track" | "done" | "empty";

export const HEALTH_ORDER: ProjectHealth[] = ["off-track", "at-risk", "on-track", "done", "empty"];

const LATE_MIN_TASKS = 3;
const LATE_RATIO = 0.25;
const SPRINT_LAG = 0.25;

export interface PortfolioSprint {
  id: string;
  name: string;
  state: SprintState;
  startDate: string;
  endDate: string;
  /** Avancement (0 à 1), en points si les tâches du sprint sont estimées. */
  progress: number;
  /** Part du temps du sprint déjà écoulée (0 à 1). */
  elapsed: number;
  tasks: number;
  doneTasks: number;
  points: number;
  donePoints: number;
}

export interface PortfolioProject {
  id: string;
  name: string;
  imageUrl: string | null;
  tasks: { total: number; done: number; open: number; overdue: number };
  points: { total: number; done: number };
  /** Avancement (0 à 1), en points si le projet est estimé. */
  progress: number;
  /** Échéance à venir la plus proche parmi les tâches ouvertes. */
  nextDue: string | null;
  /** Dernière modification du projet ou de l'une de ses tâches. */
  lastActivity: string;
  sprint: PortfolioSprint | null;
  health: ProjectHealth;
  /** Ce qui explique la santé, en français. */
  reasons: string[];
}

const plural = (count: number, word: string) => `${count} ${word}${count > 1 ? "s" : ""}`;

/** Sprint à mettre en avant : en cours ou à clôturer, sinon le prochain planifié. */
export const pickSprint = (sprints: Sprint[], now: Date) => {
  const open = sprints
    .filter((sprint) => !sprint.completed)
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
  return (
    open.find((sprint) => getSprintState(sprint, now) !== "planned") ??
    open.find((sprint) => getSprintState(sprint, now) === "planned") ??
    null
  );
};

const sprintElapsed = (sprint: Sprint, now: Date) => {
  const start = startOfDay(new Date(sprint.startDate)).getTime();
  const end = addDays(startOfDay(new Date(sprint.endDate)), 1).getTime();
  if (end <= start) return 1;
  return Math.min(1, Math.max(0, (now.getTime() - start) / (end - start)));
};

interface PortfolioInput {
  project: Project;
  tasks: Task[];
  sprints: Sprint[];
  now?: Date;
}

export const buildPortfolioProject = ({
  project,
  tasks,
  sprints,
  now = new Date(),
}: PortfolioInput): PortfolioProject => {
  const columns = parseBoardColumns(project.columnConfig);
  const isDone = (task: Task) =>
    isTaskDone({
      status: task.status,
      statusColumn: columns.find((column) => column.id === task.status),
    });
  const today = startOfDay(now);

  const done = tasks.filter(isDone);
  const open = tasks.filter((task) => !isDone(task));
  const overdue = open.filter((task) => task.dueDate && new Date(task.dueDate) < today);
  const upcoming = open
    .map((task) => task.dueDate)
    .filter((date): date is string => Boolean(date) && new Date(date) >= today)
    .sort();

  const points = tasks.reduce((sum, task) => sum + (task.estimate ?? 0), 0);
  const donePoints = done.reduce((sum, task) => sum + (task.estimate ?? 0), 0);
  const progress =
    points > 0 ? donePoints / points : tasks.length > 0 ? done.length / tasks.length : 0;

  const lastActivity = tasks.reduce(
    (latest, task) => (task.$updatedAt > latest ? task.$updatedAt : latest),
    project.$updatedAt,
  );

  let sprint: PortfolioSprint | null = null;
  const current = pickSprint(sprints, now);
  if (current) {
    const sprintTasks = tasks.filter((task) => task.sprintId === current.$id);
    const sprintDone = sprintTasks.filter(isDone);
    const total = sprintTasks.reduce((sum, task) => sum + (task.estimate ?? 0), 0);
    const totalDone = sprintDone.reduce((sum, task) => sum + (task.estimate ?? 0), 0);
    sprint = {
      id: current.$id,
      name: current.name,
      state: getSprintState(current, now),
      startDate: current.startDate,
      endDate: current.endDate,
      progress:
        total > 0
          ? totalDone / total
          : sprintTasks.length > 0
            ? sprintDone.length / sprintTasks.length
            : 0,
      elapsed: sprintElapsed(current, now),
      tasks: sprintTasks.length,
      doneTasks: sprintDone.length,
      points: total,
      donePoints: totalDone,
    };
  }

  const reasons: string[] = [];
  let health: ProjectHealth;

  if (tasks.length === 0) {
    health = "empty";
    reasons.push("Aucune tâche dans ce projet");
  } else if (open.length === 0) {
    health = "done";
    reasons.push("Toutes les tâches sont terminées");
  } else {
    const lateSprint = sprint?.state === "late";
    const manyOverdue =
      overdue.length >= LATE_MIN_TASKS && overdue.length >= open.length * LATE_RATIO;
    const sprintBehind =
      sprint?.state === "active" &&
      sprint.tasks > 0 &&
      sprint.elapsed - sprint.progress > SPRINT_LAG;

    if (lateSprint && sprint) {
      const days = differenceInCalendarDays(today, new Date(sprint.endDate));
      reasons.push(
        `Le sprint « ${sprint.name} » a dépassé sa date de fin depuis ${plural(days, "jour")}`,
      );
    }
    if (overdue.length > 0) {
      reasons.push(
        `${plural(overdue.length, "tâche")} en retard sur ${plural(open.length, "tâche")} ouverte${open.length > 1 ? "s" : ""}`,
      );
    }
    if (sprintBehind && sprint) {
      reasons.push(
        `Sprint à ${Math.round(sprint.progress * 100)} % pour ${Math.round(sprint.elapsed * 100)} % du temps écoulé`,
      );
    }

    health =
      lateSprint || manyOverdue
        ? "off-track"
        : overdue.length > 0 || sprintBehind
          ? "at-risk"
          : "on-track";
    if (health === "on-track") reasons.push("Aucune tâche en retard");
  }

  return {
    id: project.$id,
    name: project.name,
    imageUrl: project.imageUrl || null,
    tasks: { total: tasks.length, done: done.length, open: open.length, overdue: overdue.length },
    points: { total: points, done: donePoints },
    progress,
    nextDue: upcoming[0] ?? null,
    lastActivity,
    sprint,
    health,
    reasons,
  };
};

/** Tous les projets d'un espace, avec leurs tâches et sprints déjà chargés. */
export const buildPortfolio = ({
  projects,
  tasks,
  sprints,
  now = new Date(),
}: {
  projects: Project[];
  tasks: Task[];
  sprints: Sprint[];
  now?: Date;
}) =>
  projects.map((project) =>
    buildPortfolioProject({
      project,
      tasks: tasks.filter((task) => task.projectId === project.$id),
      sprints: sprints.filter((sprint) => sprint.projectId === project.$id),
      now,
    }),
  );
