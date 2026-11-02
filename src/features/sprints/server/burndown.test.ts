import { describe, expect, it } from "vitest";

import { Task } from "@/features/tasks/types";
import { Project } from "@/features/projects/types";
import { Activity, ActivityType } from "@/features/activities/types";

import { buildBurndown } from "./burndown";

const sprint = { startDate: "2026-11-02T00:00:00.000Z", endDate: "2026-11-06T00:00:00.000Z" };
const project = {} as Project;

const task = (id: string, status: string, estimate?: number) =>
  ({ $id: id, status, estimate, $updatedAt: "2026-11-04T10:00:00.000Z" }) as unknown as Task;

const statusChange = (taskId: string, to: string, at: string) =>
  ({
    taskId,
    type: ActivityType.STATUS,
    data: JSON.stringify({ from: "TODO", to }),
    $createdAt: at,
  }) as Activity;

describe("burndown", () => {
  it("compte en points quand les tâches sont estimées", () => {
    const result = buildBurndown({
      sprint,
      project,
      tasks: [task("a", "DONE", 3), task("b", "TODO", 5)],
      activities: [statusChange("a", "DONE", "2026-11-03T15:00:00.000Z")],
      now: new Date("2026-11-04T12:00:00.000Z"),
    });

    expect(result.unit).toBe("points");
    expect(result.total).toBe(8);
    expect(result.days.map((day) => day.remaining)).toEqual([8, 5, 5, null, null]);
    expect(result.days[0].ideal).toBe(8);
    expect(result.days.at(-1)?.ideal).toBe(0);
  });

  it("compte en tâches sans estimation et utilise la dernière fermeture", () => {
    const result = buildBurndown({
      sprint,
      project,
      tasks: [task("a", "DONE"), task("b", "DONE"), task("c", "TODO")],
      activities: [
        statusChange("a", "DONE", "2026-11-02T09:00:00.000Z"),
        statusChange("a", "DONE", "2026-11-05T09:00:00.000Z"),
        {
          taskId: "b",
          type: ActivityType.GITHUB_CLOSED,
          $createdAt: "2026-11-03T09:00:00.000Z",
        } as Activity,
      ],
      now: new Date("2026-11-08T00:00:00.000Z"),
    });

    expect(result.unit).toBe("tasks");
    expect(result.days.map((day) => day.remaining)).toEqual([3, 2, 2, 1, 1]);
  });

  it("une tâche terminée sans historique compte à sa dernière modification", () => {
    const result = buildBurndown({
      sprint,
      project,
      tasks: [task("a", "DONE")],
      activities: [],
      now: new Date("2026-11-08T00:00:00.000Z"),
    });
    expect(result.days.map((day) => day.remaining)).toEqual([1, 1, 0, 0, 0]);
  });
});
