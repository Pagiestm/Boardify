import { describe, expect, it } from "vitest";

import { MAX_TASK_RESULTS, normalize, searchTasks } from "./search";

const tasks = [
  { name: "Préparer la démo client" },
  { name: "Écrire la FAQ" },
  { name: "Intégration du paiement" },
];

describe("recherche de tâches", () => {
  it("ignore les accents et les majuscules", () => {
    expect(normalize("Écrire PRÉPARER")).toBe("ecrire preparer");
    expect(searchTasks(tasks, "ecrire")).toEqual([{ name: "Écrire la FAQ" }]);
    expect(searchTasks(tasks, "DÉMO")).toEqual([{ name: "Préparer la démo client" }]);
  });

  it("attend au moins 2 caractères", () => {
    expect(searchTasks(tasks, "a")).toEqual([]);
    expect(searchTasks(tasks, "  ")).toEqual([]);
  });

  it("limite le nombre de résultats", () => {
    const many = Array.from({ length: 20 }, (_, index) => ({ name: `Tâche ${index}` }));
    expect(searchTasks(many, "tache")).toHaveLength(MAX_TASK_RESULTS);
  });
});
