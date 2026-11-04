import { describe, expect, it } from "vitest";

import { defaultBoardColumns } from "@/features/projects/utils";
import { Activity, ActivityType } from "@/features/activities/types";

import { buildFlowMetrics, durationStats, waitingColumnIds, type FlowTask } from "./metrics";

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const columns = defaultBoardColumns();

const task = (id: string, status: string, createdAt: string, updatedAt = createdAt) =>
  ({ $id: id, status, $createdAt: createdAt, $updatedAt: updatedAt }) as FlowTask;

const move = (taskId: string, from: string, to: string, at: string) =>
  ({
    taskId,
    type: ActivityType.STATUS,
    data: JSON.stringify({ from, to }),
    $createdAt: at,
  }) as Activity;

const period = {
  start: new Date("2026-11-02T00:00:00+01:00"),
  end: new Date("2026-11-08T23:59:59+01:00"),
};
const now = new Date("2026-11-08T18:00:00+01:00");

describe("colonnes d'attente", () => {
  it("regroupe la première colonne et « À faire »", () => {
    expect([...waitingColumnIds(columns)]).toEqual(["BACKLOG", "TODO"]);
  });

  it("se limite à la première colonne sans « À faire »", () => {
    const custom = columns.filter((column) => column.id !== "TODO");
    expect([...waitingColumnIds(custom)]).toEqual(["BACKLOG"]);
  });
});

describe("statistiques de durée", () => {
  it("calcule médiane, moyenne et 85e centile", () => {
    const stats = durationStats([10, 1, 3, 2, 4]);
    expect(stats).toMatchObject({ count: 5, median: 3, average: 4 });
    // Interpolation linéaire entre 4 et 10.
    expect(stats.p85).toBeCloseTo(6.4);
  });

  it("reste vide sans mesure", () => {
    expect(durationStats([])).toEqual({ count: 0, median: null, average: null, p85: null });
  });
});

describe("indicateurs de flux", () => {
  const tasks = [
    // Attente, puis en cours le 3 à 9 h, terminée le 5 à 9 h.
    task("a", "DONE", "2026-11-02T09:00:00+01:00"),
    // Créée directement « en cours » : le cycle part de la création.
    task("b", "DONE", "2026-11-03T09:00:00+01:00"),
    // Encore en cours.
    task("c", "IN_PROGRESS", "2026-11-04T09:00:00+01:00"),
    // Passée directement de « À faire » à « Terminé » : pas de temps de cycle.
    task("d", "DONE", "2026-11-04T09:00:00+01:00"),
  ];
  const activities = [
    move("a", "TODO", "IN_PROGRESS", "2026-11-03T09:00:00+01:00"),
    move("a", "IN_PROGRESS", "DONE", "2026-11-05T09:00:00+01:00"),
    move("b", "IN_PROGRESS", "IN_REVIEW", "2026-11-03T21:00:00+01:00"),
    move("b", "IN_REVIEW", "DONE", "2026-11-04T09:00:00+01:00"),
    move("c", "TODO", "IN_PROGRESS", "2026-11-05T09:00:00+01:00"),
    move("d", "TODO", "DONE", "2026-11-06T09:00:00+01:00"),
  ];

  const metrics = buildFlowMetrics({ tasks, activities, columns, period, now });

  it("mesure temps de cycle et de traversée des tâches terminées", () => {
    expect(metrics.completed).toBe(3);
    expect(metrics.cycleTime.count).toBe(2);
    expect(metrics.cycleTime.median).toBe(1.5 * DAY);
    expect(metrics.leadTime.count).toBe(3);
    expect(metrics.leadTime.median).toBe(2 * DAY);
  });

  it("compte le débit par semaine", () => {
    expect(metrics.throughput).toEqual([{ week: "2026-11-02", count: 3 }]);
  });

  it("reconstitue le statut de chaque tâche jour par jour", () => {
    const day = (date: string) => metrics.cumulativeFlow.find((entry) => entry.date === date)!;
    expect(day("2026-11-02").counts).toMatchObject({ TODO: 1, IN_PROGRESS: 0, DONE: 0 });
    expect(day("2026-11-03").counts).toMatchObject({ IN_PROGRESS: 1, IN_REVIEW: 1 });
    expect(day("2026-11-04").counts).toMatchObject({ TODO: 2, IN_PROGRESS: 1, DONE: 1 });
    expect(day("2026-11-08").counts).toMatchObject({ IN_PROGRESS: 1, DONE: 3 });
    expect(metrics.cumulativeFlow).toHaveLength(7);
  });

  it("ignore les tâches terminées hors de la période", () => {
    const late = buildFlowMetrics({
      tasks,
      activities,
      columns,
      period: { start: new Date("2026-11-06T00:00:00+01:00"), end: period.end },
      now,
    });
    expect(late.completed).toBe(1);
    expect(late.cycleTime.count).toBe(0);
  });

  it("considère la fermeture d'une issue GitHub comme la fin", () => {
    const closed = buildFlowMetrics({
      tasks: [task("e", "DONE", "2026-11-02T09:00:00+01:00", "2026-11-07T12:00:00+01:00")],
      activities: [
        move("e", "TODO", "IN_PROGRESS", "2026-11-03T09:00:00+01:00"),
        {
          taskId: "e",
          type: ActivityType.GITHUB_CLOSED,
          data: JSON.stringify({ to: "octocat" }),
          $createdAt: "2026-11-04T09:00:00+01:00",
        } as Activity,
      ],
      columns,
      period,
      now,
    });
    expect(closed.cycleTime.median).toBe(DAY);
  });
});
