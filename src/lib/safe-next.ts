/** Page où revenir après connexion : seulement une adresse interne au site. */
export const safeNext = (value?: string | null) =>
  value && value.startsWith("/") && !value.startsWith("//") && !value.startsWith("/\\")
    ? value
    : null;

/** Cookie gardant la page à rouvrir après une connexion Google ou GitHub. */
export const NEXT_COOKIE = "boardify-next";
