import { describe, expect, it } from "vitest";

import { TaskRecurrence } from "../types";
import { shift } from "./recurrence";

describe("prochaine occurrence", () => {
  const date = "2026-01-31T09:00:00.000Z";

  it("décale d'un jour, d'une semaine ou d'un mois", () => {
    expect(shift(date, TaskRecurrence.DAILY).toISOString()).toBe("2026-02-01T09:00:00.000Z");
    expect(shift(date, TaskRecurrence.WEEKLY).toISOString()).toBe("2026-02-07T09:00:00.000Z");
  });

  it("un mois après le 31 janvier tombe en fin février", () => {
    expect(shift(date, TaskRecurrence.MONTHLY).toISOString()).toBe("2026-02-28T09:00:00.000Z");
  });
});
