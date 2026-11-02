import * as Sentry from "@sentry/nextjs";

import { sentryOptions } from "@/lib/sentry";

export function register() {
  Sentry.init(sentryOptions);
}

/** Erreurs des composants serveur, des routes et du middleware. */
export const onRequestError = Sentry.captureRequestError;
