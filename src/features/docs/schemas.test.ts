import { describe, expect, it } from "vitest";

import { DOC_TASKS_MAX, filterDocsByTitle, updateDocSchema } from "./schemas";

describe("filterDocsByTitle", () => {
  const docs = [{ title: "Spécifications" }, { title: "Notes de réunion" }, { title: "Décisions" }];

  it("ignore majuscules et accents", () => {
    expect(filterDocsByTitle(docs, "SPECIF")).toEqual([{ title: "Spécifications" }]);
    expect(filterDocsByTitle(docs, "decision")).toEqual([{ title: "Décisions" }]);
  });

  it("renvoie tout pour une recherche vide", () => {
    expect(filterDocsByTitle(docs, "  ")).toHaveLength(3);
  });
});

describe("updateDocSchema", () => {
  it("exige au moins une modification", () => {
    expect(updateDocSchema.safeParse({}).success).toBe(false);
    expect(updateDocSchema.safeParse({ content: "" }).success).toBe(true);
  });

  it("borne le titre et le nombre de tâches liées", () => {
    expect(updateDocSchema.safeParse({ title: "  " }).success).toBe(false);
    const taskIds = Array.from({ length: DOC_TASKS_MAX + 1 }, (_, index) => `t${index}`);
    expect(updateDocSchema.safeParse({ taskIds }).success).toBe(false);
  });
});
