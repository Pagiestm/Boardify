import { describe, expect, it } from "vitest";

import {
  entrySeconds,
  formatClock,
  formatDuration,
  parseDuration,
  summarizeEntries,
} from "./utils";

const NOW = new Date("2026-11-03T12:00:00.000Z");

describe("entrySeconds", () => {
  it("compte une entrée terminée et un chronomètre en cours", () => {
    expect(
      entrySeconds({
        memberId: "a",
        startedAt: "2026-11-03T10:00:00.000Z",
        endedAt: "2026-11-03T10:30:00.000Z",
      }),
    ).toBe(1800);
    expect(entrySeconds({ memberId: "a", startedAt: "2026-11-03T11:59:00.000Z" }, NOW)).toBe(60);
  });

  it("ne renvoie jamais de durée négative", () => {
    expect(
      entrySeconds({
        memberId: "a",
        startedAt: "2026-11-03T10:00:00.000Z",
        endedAt: "2026-11-03T09:00:00.000Z",
      }),
    ).toBe(0);
  });
});

describe("summarizeEntries", () => {
  it("additionne par membre, du plus grand au plus petit", () => {
    const summary = summarizeEntries(
      [
        {
          memberId: "a",
          startedAt: "2026-11-03T08:00:00.000Z",
          endedAt: "2026-11-03T08:20:00.000Z",
        },
        {
          memberId: "b",
          startedAt: "2026-11-03T08:00:00.000Z",
          endedAt: "2026-11-03T09:00:00.000Z",
        },
        { memberId: "a", startedAt: "2026-11-03T11:50:00.000Z" },
      ],
      NOW,
    );
    expect(summary.totalSeconds).toBe(20 * 60 + 60 * 60 + 10 * 60);
    expect(summary.byMember).toEqual([
      { memberId: "b", seconds: 3600 },
      { memberId: "a", seconds: 1800 },
    ]);
  });
});

describe("formats", () => {
  it("affiche les durées et les chronomètres", () => {
    expect(formatDuration(30)).toBe("0 min");
    expect(formatDuration(45 * 60)).toBe("45 min");
    expect(formatDuration(2 * 3600)).toBe("2 h");
    expect(formatDuration(3600 + 5 * 60)).toBe("1 h 05");
    expect(formatClock(247)).toBe("4:07");
    expect(formatClock(3729)).toBe("1:02:09");
  });
});

describe("parseDuration", () => {
  it.each([
    ["90", 90],
    ["45m", 45],
    ["45 min", 45],
    ["2h", 120],
    ["1h30", 90],
    ["1 h 30", 90],
    ["1:30", 90],
    ["1,5h", 90],
    ["0.25h", 15],
  ])("comprend « %s »", (input, minutes) => {
    expect(parseDuration(input)).toBe(minutes);
  });

  it.each(["", "abc", "0", "25h", "1:75", "-5"])("refuse « %s »", (input) => {
    expect(parseDuration(input)).toBeNull();
  });
});
