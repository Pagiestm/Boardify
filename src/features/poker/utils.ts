/** Cartes proposées : suite de Fibonacci et « ? » quand on ne sait pas. */
export const POKER_VALUES = ["0", "1", "2", "3", "5", "8", "13", "21", "?"] as const;
export type PokerValue = (typeof POKER_VALUES)[number];

interface Vote {
  memberId: string;
  value: string;
}

/**
 * Votes tels qu'un membre peut les voir : tant que les cartes ne sont pas révélées, on sait qui a
 * voté, mais seule sa propre valeur est visible.
 */
export const visibleVotes = <T extends Vote>(
  votes: T[],
  { revealed, memberId }: { revealed: boolean; memberId: string },
) =>
  votes.map(({ value, ...vote }) => ({
    ...vote,
    value: revealed || vote.memberId === memberId ? value : null,
  }));

/** Résumé des votes révélés : moyenne, extrêmes et valeur proposée (la plus votée, la plus haute à égalité). */
export const summarizeVotes = (values: (string | null)[]) => {
  const numbers = values
    .filter((value): value is string => value !== null && value !== "?")
    .map(Number)
    .filter((value) => Number.isFinite(value));
  if (numbers.length === 0) return null;

  const counts = new Map<number, number>();
  for (const value of numbers) counts.set(value, (counts.get(value) ?? 0) + 1);
  const [suggested] = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0])[0];

  return {
    average:
      Math.round((numbers.reduce((sum, value) => sum + value, 0) / numbers.length) * 10) / 10,
    min: Math.min(...numbers),
    max: Math.max(...numbers),
    suggested,
    consensus: counts.size === 1,
  };
};
