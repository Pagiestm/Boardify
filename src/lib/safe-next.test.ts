import { describe, expect, it } from "vitest";

import { safeNext } from "./safe-next";

describe("page de retour après connexion", () => {
  it("accepte les adresses internes", () => {
    expect(safeNext("/workspaces/abc/join/xyz")).toBe("/workspaces/abc/join/xyz");
  });

  it("refuse les adresses externes ou détournées", () => {
    expect(safeNext("https://exemple.com")).toBeNull();
    expect(safeNext("//exemple.com")).toBeNull();
    expect(safeNext("/\\exemple.com")).toBeNull();
    expect(safeNext("javascript:alert(1)")).toBeNull();
    expect(safeNext("")).toBeNull();
    expect(safeNext(undefined)).toBeNull();
  });
});
