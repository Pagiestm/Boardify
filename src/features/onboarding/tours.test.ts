import { describe, expect, it } from "vitest";

import { TOURS, findTour } from "./tours";

const tour = (id: string) => TOURS.find((candidate) => candidate.id === id)!;
const targets = (id: string) => tour(id).steps.map((step) => step.target);

describe("visites guidées", () => {
  it("associe chaque écran à sa visite", () => {
    expect(findTour("/workspaces/abc")?.id).toBe("home");
    expect(findTour("/workspaces/abc/projects/p1")?.id).toBe("project");
    expect(findTour("/workspaces/abc/tasks/t1")?.id).toBe("task");
    expect(findTour("/workspaces/abc/settings")?.id).toBe("settings");
  });

  it("n'en propose pas ailleurs", () => {
    expect(findTour("/workspaces/abc/tasks")).toBeUndefined();
    expect(findTour("/workspaces/abc/projects/p1/settings")).toBeUndefined();
    expect(findTour("/guide")).toBeUndefined();
  });

  it("donne un titre et un texte à chaque étape", () => {
    for (const { id, steps } of TOURS) {
      expect(steps.length, id).toBeGreaterThan(0);
      for (const step of steps) {
        expect(step.title.trim(), id).not.toBe("");
        expect(step.body.trim(), id).not.toBe("");
      }
    }
  });

  it("ne vise jamais deux fois le même élément", () => {
    for (const { id, steps } of TOURS) {
      const used = steps.map((step) => step.target).filter(Boolean);
      expect(new Set(used).size, id).toBe(used.length);
    }
  });

  it("attend un élément de la page avant de se lancer", () => {
    for (const { id, waitFor } of TOURS) {
      expect(waitFor.trim(), id).not.toBe("");
    }
  });

  it("présente les nouveautés là où elles se trouvent", () => {
    expect(targets("home")).toContain("portfolio");
    expect(targets("project")).toEqual(expect.arrayContaining(["project-flow", "project-docs"]));
    expect(targets("task")).toEqual(
      expect.arrayContaining(["task-time", "task-poker", "task-reminder"]),
    );
  });
});
