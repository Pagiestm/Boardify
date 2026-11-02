import { describe, expect, it } from "vitest";

import { Task } from "@/features/tasks/types";

import { ActivityType } from "../types";
import { describeTaskChanges } from "./activities";

const base = {
  $id: "t1",
  name: "Tâche",
  status: "TODO",
  assigneeId: "m1",
  priority: "MEDIUM",
  projectId: "p1",
  dueDate: "2026-11-10T00:00:00.000Z",
  labelIds: ["a", "b"],
  estimate: 3,
} as unknown as Task;

describe("historique d'une tâche", () => {
  it("ne note rien quand rien ne change", () => {
    expect(describeTaskChanges(base, { ...base })).toEqual([]);
  });

  it("note le changement de statut avec l'avant et l'après", () => {
    expect(describeTaskChanges(base, { ...base, status: "DONE" })).toEqual([
      { type: ActivityType.STATUS, change: { from: "TODO", to: "DONE" } },
    ]);
  });

  it("ignore l'ordre des étiquettes", () => {
    const changes = describeTaskChanges(base, { ...base, labelIds: ["b", "a"] });
    expect(changes.find((entry) => entry.type === ActivityType.LABELS)).toBeUndefined();
  });

  it("note plusieurs changements à la fois", () => {
    const types = describeTaskChanges(base, {
      ...base,
      assigneeId: "m2",
      estimate: 5,
      projectId: "p2",
    }).map((entry) => entry.type);
    expect(types).toEqual(
      expect.arrayContaining([ActivityType.ASSIGNEE, ActivityType.ESTIMATE, ActivityType.PROJECT]),
    );
  });
});
