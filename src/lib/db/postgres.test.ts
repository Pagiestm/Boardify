import { describe, expect, it } from "vitest";
import { getTableColumns, type SQL } from "drizzle-orm";
import { PgDialect, type PgColumn } from "drizzle-orm/pg-core";

import type { Task } from "@/features/tasks/types";

import { tasks } from "./schema";
import { afterCursor, newId, sortOf, whereToSql } from "./postgres";

const columns = getTableColumns(tasks) as Record<string, PgColumn>;
const dialect = new PgDialect();
const render = (sql: SQL | undefined | null) => (sql ? dialect.sqlToQuery(sql) : sql);

describe("whereToSql", () => {
  it("traduit égalité, liste, vide, comparaisons et recherche", () => {
    const query = render(
      whereToSql<Task>(columns, {
        workspaceId: "w1",
        status: ["TODO", "DONE"],
        sprintId: null,
        dueDate: { gte: "2026-11-01T00:00:00.000Z" },
        name: { search: "50%_off" },
        labelIds: { has: ["l1", "l2"] },
      }),
    );
    expect(query?.sql).toBe(
      '("tasks"."workspace_id" = $1 and "tasks"."status" in ($2, $3) and "tasks"."sprint_id" is null' +
        ' and "tasks"."due_date" >= $4 and "tasks"."name" ilike $5 and "tasks"."label_ids" && $6)',
    );
    expect(query?.params[3]).toBe("2026-11-01T00:00:00.000Z");
    expect(query?.params[4]).toBe("%50\\%\\_off%");
  });

  it("utilise les colonnes système", () => {
    expect(render(whereToSql(columns, { $id: ["a"] }))?.sql).toBe('"tasks"."id" in ($1)');
  });

  it("renvoie null quand le résultat est forcément vide", () => {
    expect(whereToSql<Task>(columns, { workspaceId: "w1", $id: [] })).toBeNull();
    expect(whereToSql<Task>(columns, { labelIds: { has: [] } })).toBeNull();
  });

  it("refuse un champ inconnu", () => {
    expect(() => whereToSql<Task>(columns, { inconnu: "x" } as never)).toThrow("Champ inconnu");
  });
});

describe("pagination", () => {
  it("départage toujours par identifiant", () => {
    const sort = sortOf<Task>(columns, { position: "asc" });
    expect(sort.map(({ column, direction }) => [column.name, direction])).toEqual([
      ["position", "asc"],
      ["id", "asc"],
    ]);
  });

  it("reprend après le curseur, valeurs vides comprises", () => {
    const sort = sortOf<Task>(columns, { dueDate: "desc" });
    const query = render(afterCursor(sort, { due_date: null, id: "abc" }));
    expect(query?.sql).toBe(
      '("tasks"."due_date" is not null or ("tasks"."due_date" is null and "tasks"."id" > $1))',
    );
  });
});

describe("newId", () => {
  it("produit 20 caractères hexadécimaux croissants dans le temps", async () => {
    const first = newId();
    await new Promise((resolve) => setTimeout(resolve, 5));
    const second = newId();
    expect(first).toMatch(/^[0-9a-f]{20}$/);
    expect(second.slice(0, 13) > first.slice(0, 13)).toBe(true);
  });
});
