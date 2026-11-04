import { describe, expect, it } from "vitest";

import { summarizeVotes, visibleVotes } from "./utils";

const votes = [
  { $id: "v1", memberId: "a", value: "5" },
  { $id: "v2", memberId: "b", value: "8" },
];

describe("visibleVotes", () => {
  it("cache les valeurs des autres avant la révélation", () => {
    expect(visibleVotes(votes, { revealed: false, memberId: "a" })).toEqual([
      { $id: "v1", memberId: "a", value: "5" },
      { $id: "v2", memberId: "b", value: null },
    ]);
  });

  it("montre tout une fois révélé", () => {
    expect(
      visibleVotes(votes, { revealed: true, memberId: "c" }).map((vote) => vote.value),
    ).toEqual(["5", "8"]);
  });
});

describe("summarizeVotes", () => {
  it("ignore « ? » et propose la valeur la plus votée", () => {
    expect(summarizeVotes(["3", "5", "5", "?", null])).toEqual({
      average: 4.3,
      min: 3,
      max: 5,
      suggested: 5,
      consensus: false,
    });
  });

  it("à égalité, retient la plus haute", () => {
    expect(summarizeVotes(["3", "8"])?.suggested).toBe(8);
  });

  it("détecte le consensus et l'absence de vote chiffré", () => {
    expect(summarizeVotes(["2", "2"])?.consensus).toBe(true);
    expect(summarizeVotes(["?", null])).toBeNull();
  });
});
