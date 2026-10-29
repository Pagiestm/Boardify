import { useEffect, useState } from "react";

/** Valeur mise à jour seulement après `delay` ms sans changement. */
export const useDebouncedValue = <T>(value: T, delay: number) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timeout = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timeout);
  }, [value, delay]);

  return debounced;
};
