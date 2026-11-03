import { describe, expect, it } from "vitest";

import { toRealtimeChange } from "./filter";

const subscriber = { workspaceId: "w1", userId: "u1" };

describe("toRealtimeChange", () => {
  it("transmet les changements de l'espace", () => {
    expect(
      toRealtimeChange({ topic: "tasks", workspaceId: "w1", taskId: "t1" }, subscriber),
    ).toEqual({ topic: "tasks", taskId: "t1" });
  });

  it("ignore les autres espaces", () => {
    expect(toRealtimeChange({ topic: "tasks", workspaceId: "w2" }, subscriber)).toBeNull();
  });

  it("ne transmet les notifications qu'à leur destinataire", () => {
    const notification = { topic: "notifications" as const, workspaceId: "w1" };
    expect(toRealtimeChange({ ...notification, userId: "u1" }, subscriber)).not.toBeNull();
    expect(toRealtimeChange({ ...notification, userId: "u2" }, subscriber)).toBeNull();
  });
});
