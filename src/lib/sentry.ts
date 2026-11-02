import type * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

/**
 * Réglages communs de Sentry (navigateur et serveur). Actif seulement en production et si le
 * DSN est défini ; uniquement les erreurs (pas de suivi de performance), pour rester dans l'offre
 * gratuite.
 */
export const sentryOptions = {
  dsn,
  enabled: Boolean(dsn) && process.env.NODE_ENV === "production",
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.VERCEL_ENV ?? "production",
  release: process.env.NEXT_PUBLIC_APP_VERSION,
  tracesSampleRate: 0,
  // Rien de personnel ni de secret : ni utilisateur, ni cookies (session), ni en-têtes, ni corps,
  // ni paramètres d'URL (liens de réinitialisation), ni contenus échangés avec l'IA.
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: false,
    httpBodies: [],
    urlQueryParams: false,
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
  },
  ignoreErrors: [
    // Nouvelle version déployée pendant l'utilisation : la page se recharge toute seule.
    "ChunkLoadError",
    /Loading (CSS )?chunk/i,
    /Failed to load chunk/i,
    // Coupures réseau côté utilisateur.
    /^(TypeError: )?(Failed to fetch|Load failed|NetworkError when attempting to fetch resource\.?)$/,
    "ResizeObserver loop completed with undelivered notifications.",
  ],
} satisfies Sentry.BrowserOptions & Sentry.NodeOptions;
