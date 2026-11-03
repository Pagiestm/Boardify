import { describe, expect, it } from "vitest";

import { changePayload, TABLE_TOPICS } from "./changes";

describe("changePayload", () => {
  it("annonce l'espace et la tâche d'une ligne", () => {
    expect(
      changePayload("comments", { id: "c1", workspaceId: "w1", taskId: "t1", content: "Long" }),
    ).toEqual({ topic: "comments", workspaceId: "w1", taskId: "t1" });
  });

  it("utilise l'identifiant de l'espace pour la table des espaces", () => {
    expect(changePayload("workspaces", { id: "w1", name: "Équipe" })).toEqual({
      topic: "workspaces",
      workspaceId: "w1",
    });
  });

  it("garde le destinataire des notifications seulement", () => {
    expect(
      changePayload("notifications", { id: "n1", workspaceId: "w1", taskId: "t1", userId: "u1" }),
    ).toEqual({ topic: "notifications", workspaceId: "w1", taskId: "t1", userId: "u1" });
    expect(changePayload("members", { id: "m1", workspaceId: "w1", userId: "u1" })).toEqual({
      topic: "members",
      workspaceId: "w1",
    });
  });

  it("n'annonce rien sans espace", () => {
    expect(changePayload("tasks", { id: "t1", workspaceId: null })).toBeNull();
  });

  it("n'envoie que des identifiants", () => {
    const payload = changePayload("tasks", {
      id: "t1",
      workspaceId: "w1",
      description: "x".repeat(20_000),
    });
    expect(JSON.stringify(payload).length).toBeLessThan(200);
  });

  it("n'annonce pas les réglages de l'assistant", () => {
    expect(TABLE_TOPICS.ai_settings).toBeUndefined();
    expect(TABLE_TOPICS.checklist_items).toBe("checklist");
  });
});
