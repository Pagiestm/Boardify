import { describe, expect, it } from "vitest";

import { Task } from "@/features/tasks/types";

import { findTask, matchTasks } from "./match";

const tasks = [
  { $id: "6abc123", name: "Corriger le bug" },
  { $id: "6def456", name: "Écrire la doc" },
] as Task[];

describe("tâches renvoyées par l'IA", () => {
  it("retrouve une tâche par identifiant, même entre crochets ou entouré de texte", () => {
    expect(findTask(tasks, "6abc123")?.$id).toBe("6abc123");
    expect(findTask(tasks, " [6abc123] ")?.$id).toBe("6abc123");
    expect(findTask(tasks, "tâche 6def456")?.$id).toBe("6def456");
  });

  it("retrouve une tâche par son nom exact", () => {
    expect(findTask(tasks, "écrire LA doc")?.$id).toBe("6def456");
    expect(findTask(tasks, "inconnue")).toBeUndefined();
  });

  it("ignore les doublons et les identifiants inconnus", () => {
    const matched = matchTasks(tasks, [
      { taskId: "6abc123" },
      { taskId: "[6abc123]" },
      { taskId: "rien" },
      { taskId: "6def456" },
    ]);
    expect(matched.map(({ task }) => task.$id)).toEqual(["6abc123", "6def456"]);
  });
});
