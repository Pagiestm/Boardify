import "server-only";

import type { Db } from "@/lib/db";
import { getUserIdentities } from "@/lib/users";

// Au-delà, l'appel est abandonné : certains modèles ne répondent jamais (offre gratuite saturée…).
export const GENERATE_TIMEOUT_MS = 60_000;
export const STREAM_TIMEOUT_MS = 120_000;

export const SYSTEM = `Tu es l'assistant de Boardify, un outil de gestion de projets.
Réponds toujours en français, de façon concise, concrète et professionnelle.
N'invente pas d'informations absentes du contexte fourni.`;

export const NOT_CONFIGURED = {
  error:
    "L'assistant IA n'est pas configuré pour cet espace (Paramètres de l'espace → Assistant IA).",
};

/** Date du jour à Paris, au format AAAA-MM-JJ. */
export const today = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date());

export const formatDay = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris" }).format(new Date(iso));

export const getMemberNames = async (db: Db, workspaceId: string) => {
  const { documents } = await db.members.list({ where: { workspaceId }, limit: 200 });
  const identities = await getUserIdentities(documents.map((member) => member.userId));
  return new Map(
    documents.map((member) => [member.$id, identities.get(member.userId)?.name ?? "Membre"]),
  );
};
