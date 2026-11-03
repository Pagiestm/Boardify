import "server-only";

import postgres from "postgres";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";

/** Base utilisée par l'application : Appwrite tant que la bascule vers Postgres n'est pas faite. */
export const DB_PROVIDER = process.env.DB_PROVIDER === "postgres" ? "postgres" : "appwrite";

// Gardée d'un rechargement à l'autre en développement, pour ne pas multiplier les connexions.
const globalForDb = globalThis as typeof globalThis & { boardifyDb?: PostgresJsDatabase };

/** Connexion Postgres partagée, ouverte à la première requête. */
export const getPostgres = () => {
  if (!globalForDb.boardifyDb) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("DATABASE_URL manquante");
    // Sans requêtes préparées : compatible avec les poolers en mode transaction (PgBouncer…).
    const client = postgres(url, { max: 5, prepare: false });
    globalForDb.boardifyDb = drizzle({ client });
  }
  return globalForDb.boardifyDb;
};
