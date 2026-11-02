import { describe, expect, it } from "vitest";

import { Project } from "@/features/projects/types";

import { TaskStatus } from "../types";
import { isTaskDone } from "../utils";
import { getOpenStatus, isDoneStatus } from "./done";

const project = (columns: object[]) => ({ columnConfig: JSON.stringify(columns) }) as Project;

describe("statuts terminés", () => {
  it("sans configuration, seul DONE est terminé", () => {
    expect(isDoneStatus(undefined, TaskStatus.DONE)).toBe(true);
    expect(isDoneStatus(undefined, TaskStatus.IN_REVIEW)).toBe(false);
  });

  it("respecte les colonnes marquées comme finales", () => {
    const custom = project([
      { id: "todo", label: "À faire" },
      { id: "shipped", label: "Livré", done: true },
    ]);
    expect(isDoneStatus(custom, "shipped")).toBe(true);
    expect(isDoneStatus(custom, "todo")).toBe(false);
  });

  it("isTaskDone utilise la colonne quand elle est connue", () => {
    expect(
      isTaskDone({
        status: "x",
        statusColumn: { id: "x", label: "X", color: "zinc", hidden: false, done: true },
      }),
    ).toBe(true);
    expect(isTaskDone({ status: TaskStatus.DONE })).toBe(true);
  });

  it("la colonne ouverte est la première non finale et visible", () => {
    const custom = project([
      { id: "hidden", label: "Cachée", hidden: true },
      { id: "done", label: "Fini", done: true },
      { id: "open", label: "Ouverte" },
    ]);
    expect(getOpenStatus(custom)).toBe("open");
    expect(getOpenStatus(undefined)).toBe(TaskStatus.BACKLOG);
  });
});
