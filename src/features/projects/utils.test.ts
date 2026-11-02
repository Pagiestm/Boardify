import { describe, expect, it } from "vitest";

import { TaskStatus } from "@/features/tasks/types";

import { defaultBoardColumns, parseBoardColumns, serializeBoardColumns } from "./utils";

describe("parseBoardColumns", () => {
  it("renvoie les colonnes par défaut sans configuration", () => {
    expect(parseBoardColumns()).toEqual(defaultBoardColumns());
    expect(parseBoardColumns("pas du json")).toEqual(defaultBoardColumns());
    expect(parseBoardColumns("[]")).toEqual(defaultBoardColumns());
  });

  it("seule la colonne Terminé est finale par défaut", () => {
    const done = defaultBoardColumns().filter((column) => column.done);
    expect(done.map((column) => column.id)).toEqual([TaskStatus.DONE]);
  });

  it("garde les colonnes personnalisées et ignore les doublons et entrées invalides", () => {
    const columns = parseBoardColumns(
      JSON.stringify([
        { id: "col_a", label: "  Recette  ", color: "violet", done: true },
        { id: "col_a", label: "Doublon" },
        null,
        { label: "Sans identifiant" },
        { status: TaskStatus.TODO },
      ]),
    );
    expect(columns.map((column) => column.id)).toEqual(["col_a", TaskStatus.TODO]);
    expect(columns[0]).toMatchObject({
      label: "Recette",
      color: "violet",
      done: true,
      hidden: false,
    });
    expect(columns[1]).toMatchObject({ label: "À faire", done: false });
  });

  it("limite le nom à 30 caractères et remplace une couleur inconnue", () => {
    const [column] = parseBoardColumns(
      JSON.stringify([{ id: "col_x", label: "x".repeat(50), color: "fluo" }]),
    );
    expect(column.label).toHaveLength(30);
    expect(column.color).toBe("zinc");
  });

  it("relit à l'identique ce qu'il a enregistré", () => {
    const columns = parseBoardColumns(
      JSON.stringify([{ id: "col_a", label: "A", color: "blue", hidden: true, done: false }]),
    );
    expect(parseBoardColumns(serializeBoardColumns(columns))).toEqual(columns);
  });
});
