import { describe, expect, it } from "vitest";

import { formatReminder, quickReminders, toDateTimeLocal } from "./utils";

// Les tests tournent à l'heure de Paris (TZ=Europe/Paris, voir vitest.config.ts).
const local = (iso: string) => toDateTimeLocal(new Date(iso));

describe("quickReminders", () => {
  it("propose les quatre choix un mardi après-midi", () => {
    // Mardi 3 novembre 2026, 14 h 20 à Paris.
    const options = quickReminders(new Date(2026, 10, 3, 14, 20, 45));
    expect(options.map((option) => [option.id, toDateTimeLocal(option.date)])).toEqual([
      ["hour", "2026-11-03T15:20"],
      ["evening", "2026-11-03T18:00"],
      ["tomorrow", "2026-11-04T09:00"],
      ["monday", "2026-11-09T09:00"],
    ]);
  });

  it("retire « ce soir » à partir de 17 h", () => {
    const options = quickReminders(new Date(2026, 10, 3, 17, 5));
    expect(options.map((option) => option.id)).toEqual(["hour", "tomorrow", "monday"]);
  });

  it("le dimanche, lundi se confond avec demain", () => {
    const options = quickReminders(new Date(2026, 10, 8, 10, 0));
    expect(options.map((option) => option.id)).toEqual(["hour", "evening", "tomorrow"]);
  });

  it("le lundi, propose le lundi suivant", () => {
    const monday = quickReminders(new Date(2026, 10, 9, 8, 0)).find((o) => o.id === "monday");
    expect(monday && toDateTimeLocal(monday.date)).toBe("2026-11-16T09:00");
  });

  it("tient compte du passage à l'heure d'hiver", () => {
    // Samedi 24 octobre 2026 : demain 9 h tombe le jour du changement d'heure.
    const tomorrow = quickReminders(new Date(2026, 9, 24, 12, 0)).find((o) => o.id === "tomorrow");
    expect(tomorrow?.date.toISOString()).toBe("2026-10-25T08:00:00.000Z");
    expect(local("2026-10-25T08:00:00.000Z")).toBe("2026-10-25T09:00");
  });
});

describe("formatReminder", () => {
  const now = new Date(2026, 10, 3, 14, 0);

  it("décrit le jour relatif et l'heure", () => {
    expect(formatReminder(new Date(2026, 10, 3, 18, 0), now)).toBe("aujourd'hui à 18:00");
    expect(formatReminder(new Date(2026, 10, 4, 9, 0), now)).toBe("demain à 09:00");
    expect(formatReminder(new Date(2026, 10, 9, 9, 0), now)).toBe("lun. 9 nov. à 09:00");
  });
});
