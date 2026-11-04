import { describe, expect, it } from "vitest";

import { Task } from "@/features/tasks/types";
import { Sprint } from "@/features/sprints/types";
import { Project } from "@/features/projects/types";

import { buildPortfolio, buildPortfolioProject, pickSprint } from "./portfolio";

const now = new Date("2026-11-10T12:00:00+01:00");
const project = {
  $id: "p1",
  name: "Site",
  imageUrl: "",
  $updatedAt: "2026-11-01T10:00:00.000Z",
} as Project;

let counter = 0;
const task = (status: string, extra: Partial<Task> = {}) =>
  ({
    $id: `t${++counter}`,
    projectId: "p1",
    status,
    dueDate: "2026-11-20T00:00:00.000Z",
    $updatedAt: "2026-11-05T10:00:00.000Z",
    ...extra,
  }) as Task;

const sprint = (id: string, startDate: string, endDate: string, completed = false) =>
  ({ $id: id, projectId: "p1", name: id, startDate, endDate, completed }) as Sprint;

describe("sprint mis en avant", () => {
  it("préfère le sprint en cours au prochain planifié", () => {
    const sprints = [
      sprint("next", "2026-11-16T00:00:00+01:00", "2026-11-27T00:00:00+01:00"),
      sprint("current", "2026-11-02T00:00:00+01:00", "2026-11-13T00:00:00+01:00"),
      sprint("old", "2026-10-19T00:00:00+02:00", "2026-10-30T00:00:00+01:00", true),
    ];
    expect(pickSprint(sprints, now)?.$id).toBe("current");
  });

  it("prend le prochain planifié sans sprint en cours", () => {
    const sprints = [sprint("next", "2026-11-16T00:00:00+01:00", "2026-11-27T00:00:00+01:00")];
    expect(pickSprint(sprints, now)?.$id).toBe("next");
  });
});

describe("portefeuille", () => {
  it("calcule l'avancement en points et la prochaine échéance", () => {
    const result = buildPortfolioProject({
      project,
      tasks: [
        task("DONE", { estimate: 3 }),
        task("TODO", { estimate: 1, dueDate: "2026-11-12T00:00:00.000Z" }),
        task("IN_PROGRESS", { $updatedAt: "2026-11-09T08:00:00.000Z" }),
      ],
      sprints: [],
      now,
    });

    expect(result.tasks).toEqual({ total: 3, done: 1, open: 2, overdue: 0 });
    expect(result.points).toEqual({ total: 4, done: 3 });
    expect(result.progress).toBe(0.75);
    expect(result.nextDue).toBe("2026-11-12T00:00:00.000Z");
    expect(result.lastActivity).toBe("2026-11-09T08:00:00.000Z");
    expect(result.health).toBe("on-track");
  });

  it("signale les retards : à surveiller, puis en retard", () => {
    const late = { dueDate: "2026-11-05T00:00:00.000Z" };
    const atRisk = buildPortfolioProject({
      project,
      tasks: [task("TODO", late), task("TODO"), task("TODO"), task("TODO")],
      sprints: [],
      now,
    });
    expect(atRisk.health).toBe("at-risk");
    expect(atRisk.reasons[0]).toBe("1 tâche en retard sur 4 tâches ouvertes");

    const offTrack = buildPortfolioProject({
      project,
      tasks: [task("TODO", late), task("TODO", late), task("TODO", late), task("TODO")],
      sprints: [],
      now,
    });
    expect(offTrack.health).toBe("off-track");
    expect(offTrack.tasks.overdue).toBe(3);
  });

  it("met en retard un sprint qui a dépassé sa date", () => {
    const result = buildPortfolioProject({
      project,
      tasks: [task("TODO", { sprintId: "s1" })],
      sprints: [sprint("s1", "2026-10-26T00:00:00+01:00", "2026-11-06T00:00:00+01:00")],
      now,
    });
    expect(result.sprint?.state).toBe("late");
    expect(result.health).toBe("off-track");
    expect(result.reasons[0]).toContain("depuis 4 jours");
  });

  it("repère un sprint qui avance moins vite que le temps", () => {
    const result = buildPortfolioProject({
      project,
      tasks: [task("TODO", { sprintId: "s1" }), task("TODO", { sprintId: "s1" })],
      sprints: [sprint("s1", "2026-11-02T00:00:00+01:00", "2026-11-13T00:00:00+01:00")],
      now,
    });
    expect(result.sprint).toMatchObject({ state: "active", progress: 0, tasks: 2 });
    expect(result.sprint!.elapsed).toBeGreaterThan(0.6);
    expect(result.health).toBe("at-risk");
  });

  it("distingue les projets vides et terminés", () => {
    const [empty, finished] = buildPortfolio({
      projects: [project, { ...project, $id: "p2" }],
      tasks: [task("DONE", { projectId: "p2" })],
      sprints: [],
      now,
    });
    expect(empty.health).toBe("empty");
    expect(finished.health).toBe("done");
  });
});
