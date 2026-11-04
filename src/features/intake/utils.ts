import type { IntakeSubmission } from "./schemas";

/** Jours laissés pour traiter une demande reçue par le formulaire. */
export const INTAKE_DUE_DAYS = 7;

/** Neutralise la mise en forme Markdown d'un texte saisi par un visiteur (nom, e-mail). */
export const escapeMarkdown = (value: string) => value.replace(/[\\`*_{}[\]()#+\-.!|<>~]/g, "\\$&");

/** Description de la tâche créée : la demande, puis qui l'a envoyée. */
export const buildIntakeDescription = ({
  name,
  email,
  description,
}: Pick<IntakeSubmission, "name" | "email" | "description">) => {
  const author = escapeMarkdown(name.trim());
  const contact = email?.trim() ? ` (${escapeMarkdown(email.trim())})` : "";
  return `${description.trim()}\n\n---\n\nDemande envoyée par **${author}**${contact} via le formulaire public.`;
};

/** Adresse IP du visiteur derrière le proxy de l'hébergeur. */
export const clientIp = (headers: Headers) =>
  headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
  headers.get("x-real-ip")?.trim() ||
  "unknown";

/**
 * Limite de débit en mémoire, par fenêtre glissante. Suffisante contre l'abus d'un formulaire :
 * chaque instance du serveur compte de son côté et le compteur repart à zéro au redémarrage.
 */
export const createRateLimiter = ({ limit, windowMs }: { limit: number; windowMs: number }) => {
  const hits = new Map<string, number[]>();

  return {
    /** Enregistre une tentative ; faux si la limite est atteinte (la tentative n'est pas comptée). */
    hit(key: string, now = Date.now()) {
      const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);

      // Nettoyage ponctuel pour ne pas garder les clés inactives indéfiniment.
      if (hits.size > 5_000) {
        for (const [other, times] of hits) {
          if (times.every((time) => now - time >= windowMs)) hits.delete(other);
        }
      }
      return true;
    },
  };
};
