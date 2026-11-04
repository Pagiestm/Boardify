import { addDays, format, isSameDay, set } from "date-fns";
import { fr } from "date-fns/locale";

/** Un rappel se programme au plus un an à l'avance. */
export const MAX_REMINDER_DAYS = 366;

export interface QuickReminder {
  id: "hour" | "evening" | "tomorrow" | "monday";
  label: string;
  date: Date;
}

const at = (day: Date, hours: number) =>
  set(day, { hours, minutes: 0, seconds: 0, milliseconds: 0 });

/**
 * Choix rapides, à l'heure locale : dans 1 h, ce soir 18 h (avant 17 h seulement), demain 9 h et
 * lundi 9 h (s'il ne tombe pas demain).
 */
export const quickReminders = (now = new Date()): QuickReminder[] => {
  const options: QuickReminder[] = [
    {
      id: "hour",
      label: "Dans 1 heure",
      date: set(new Date(now.getTime() + 60 * 60 * 1000), { seconds: 0, milliseconds: 0 }),
    },
  ];

  if (now.getHours() < 17) {
    options.push({ id: "evening", label: "Ce soir à 18 h", date: at(now, 18) });
  }

  const tomorrow = at(addDays(now, 1), 9);
  options.push({ id: "tomorrow", label: "Demain à 9 h", date: tomorrow });

  // Lundi prochain, jamais aujourd'hui.
  const daysToMonday = (8 - now.getDay()) % 7 || 7;
  const monday = at(addDays(now, daysToMonday), 9);
  if (!isSameDay(monday, tomorrow)) {
    options.push({ id: "monday", label: "Lundi à 9 h", date: monday });
  }

  return options;
};

/** « aujourd'hui à 18:00 », « demain à 09:00 », « lun. 10 nov. à 09:00 ». */
export const formatReminder = (date: Date, now = new Date()) => {
  const time = format(date, "HH:mm");
  if (isSameDay(date, now)) return `aujourd'hui à ${time}`;
  if (isSameDay(date, addDays(now, 1))) return `demain à ${time}`;
  return format(date, "EEE d MMM 'à' HH:mm", { locale: fr });
};

/** Valeur d'un champ `datetime-local` (heure locale, sans fuseau). */
export const toDateTimeLocal = (date: Date) => format(date, "yyyy-MM-dd'T'HH:mm");
