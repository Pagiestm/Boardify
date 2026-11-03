import { AppwriteException } from "node-appwrite";

/** Document introuvable (implémentation Postgres). */
export class NotFoundError extends Error {
  readonly code = 404;

  constructor(message = "Document introuvable") {
    super(message);
    this.name = "NotFoundError";
  }
}

/** Code Postgres d'une contrainte d'unicité non respectée. */
const UNIQUE_VIOLATION = "23505";

/** Code d'erreur Postgres, y compris quand Drizzle l'enveloppe dans sa propre erreur. */
const postgresCode = (error: unknown): string | undefined => {
  for (let current = error; current instanceof Error; current = current.cause) {
    const code = (current as Error & { code?: unknown }).code;
    if (typeof code === "string") return code;
  }
  return undefined;
};

/** Le document demandé n'existe pas. */
export const isNotFound = (error: unknown) =>
  error instanceof NotFoundError || (error instanceof AppwriteException && error.code === 404);

/** Un document avec cet identifiant (ou cette valeur unique) existe déjà. */
export const isConflict = (error: unknown) =>
  (error instanceof AppwriteException && error.code === 409) ||
  postgresCode(error) === UNIQUE_VIOLATION;
