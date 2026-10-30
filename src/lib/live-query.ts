import { isRealtimeConnected } from "@/features/realtime/store";

/**
 * Données partagées par l'équipe : rafraîchies à chaque changement poussé par le temps réel,
 * avec un sondage de secours (rapide si le temps réel est coupé).
 */
export const LIVE_QUERY_OPTIONS = {
  refetchInterval: () => (isRealtimeConnected() ? 60_000 : 5_000),
  refetchOnWindowFocus: "always",
} as const;
