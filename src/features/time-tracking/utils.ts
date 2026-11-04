/** Durée maximale d'une saisie manuelle : une journée. */
export const MAX_ENTRY_MINUTES = 24 * 60;

interface TimedEntry {
  memberId: string;
  startedAt: string;
  endedAt?: string | null;
}

/** Secondes écoulées d'une entrée ; un chronomètre en cours compte jusqu'à `now`. */
export const entrySeconds = (entry: TimedEntry, now = new Date()) => {
  const start = new Date(entry.startedAt).getTime();
  const end = entry.endedAt ? new Date(entry.endedAt).getTime() : now.getTime();
  return Math.max(0, Math.floor((end - start) / 1000));
};

/** Temps total et détail par membre, du plus grand au plus petit. */
export const summarizeEntries = (entries: TimedEntry[], now = new Date()) => {
  const perMember = new Map<string, number>();
  for (const entry of entries) {
    perMember.set(entry.memberId, (perMember.get(entry.memberId) ?? 0) + entrySeconds(entry, now));
  }
  const byMember = [...perMember.entries()]
    .map(([memberId, seconds]) => ({ memberId, seconds }))
    .sort((a, b) => b.seconds - a.seconds);
  return { totalSeconds: byMember.reduce((sum, item) => sum + item.seconds, 0), byMember };
};

/** « 45 min », « 2 h », « 1 h 05 » ; en dessous d'une minute, « 0 min ». */
export const formatDuration = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest === 0 ? `${hours} h` : `${hours} h ${String(rest).padStart(2, "0")}`;
};

/** Affichage d'un chronomètre en cours : « 4:07 », « 1:02:09 ». */
export const formatClock = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  const pad = (value: number) => String(value).padStart(2, "0");
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(secs)}` : `${minutes}:${pad(secs)}`;
};

/**
 * Durée saisie, en minutes : « 90 » (minutes), « 45m », « 2h », « 1h30 », « 1 h 30 », « 1:30 »,
 * « 1,5h ». Null si la saisie n'est pas comprise ou hors limites.
 */
export const parseDuration = (input: string): number | null => {
  const value = input.trim().toLowerCase().replace(",", ".").replace(/\s+/g, "");
  if (!value) return null;

  let minutes: number | null = null;
  let match: RegExpMatchArray | null;
  if ((match = value.match(/^(\d+):([0-5]\d)$/))) {
    minutes = Number(match[1]) * 60 + Number(match[2]);
  } else if ((match = value.match(/^(\d+(?:\.\d+)?)h(?:(\d{1,2})(?:m|min)?)?$/))) {
    minutes = Math.round(Number(match[1]) * 60) + Number(match[2] ?? 0);
  } else if ((match = value.match(/^(\d+)(?:m|min)?$/))) {
    minutes = Number(match[1]);
  }

  return minutes !== null && minutes >= 1 && minutes <= MAX_ENTRY_MINUTES ? minutes : null;
};
