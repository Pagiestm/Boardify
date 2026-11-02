import { describe, expect, it } from "vitest";

import { findTour } from "./tours";

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
});
