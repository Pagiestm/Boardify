import { useEffect, useState } from "react";

/** Heure courante, rafraîchie chaque seconde tant que `active` est vrai (chronomètre en cours). */
export const useNow = (active: boolean) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!active) return;
    const tick = () => setNow(new Date());
    // Première mise à jour tout de suite (l'heure gardée peut dater), puis chaque seconde.
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [active]);

  return now;
};
