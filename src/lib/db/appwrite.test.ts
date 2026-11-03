import { Query } from "node-appwrite";
import { describe, expect, it } from "vitest";

import { toQueries } from "./appwrite";

type Doc = {
  workspaceId: string;
  status: string;
  labelIds: string[];
  name: string;
  dueDate: string;
};

describe("traduction des requêtes vers Appwrite", () => {
  it("égalité, liste de valeurs et champ vide", () => {
    expect(
      toQueries<Doc>({ where: { workspaceId: "w1", status: ["TODO", "DONE"], name: null } }),
    ).toEqual([
      Query.equal("workspaceId", "w1"),
      Query.equal("status", ["TODO", "DONE"]),
      Query.isNull("name"),
    ]);
  });

  it("une liste vide ne renvoie jamais rien", () => {
    expect(toQueries<Doc>({ where: { $id: [] } })).toBeNull();
    expect(toQueries<Doc>({ where: { labelIds: { has: [] } } })).toBeNull();
  });

  it("contenu d'un tableau, recherche de texte et comparaisons", () => {
    expect(
      toQueries<Doc>({
        where: {
          labelIds: { has: "l1" },
          name: { search: "démo" },
          dueDate: { gte: "2026-01-01", lt: "2026-02-01" },
        },
      }),
    ).toEqual([
      Query.contains("labelIds", ["l1"]),
      Query.contains("name", "démo"),
      Query.greaterThanEqual("dueDate", "2026-01-01"),
      Query.lessThan("dueDate", "2026-02-01"),
    ]);
  });

  it("tri, limite et pagination, dans cet ordre", () => {
    expect(
      toQueries<Doc>({
        where: { workspaceId: "w1" },
        orderBy: { dueDate: "asc", $createdAt: "desc" },
        limit: 50,
        cursorAfter: "doc9",
      }),
    ).toEqual([
      Query.equal("workspaceId", "w1"),
      Query.orderAsc("dueDate"),
      Query.orderDesc("$createdAt"),
      Query.limit(50),
      Query.cursorAfter("doc9"),
    ]);
  });

  it("ignore les conditions non définies", () => {
    expect(toQueries<Doc>({ where: { workspaceId: "w1", status: undefined } })).toEqual([
      Query.equal("workspaceId", "w1"),
    ]);
  });
});
