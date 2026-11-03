import "server-only";

import { DB_PROVIDER } from "@/lib/db/client";

import { subscribeAppwrite } from "./appwrite";
import { subscribePostgres } from "./postgres";
import type { Subscribe } from "./types";

/**
 * Changements d'un espace, depuis la base utilisée : Appwrite Realtime, ou LISTEN / NOTIFY
 * quand les données sont dans Postgres (`DB_PROVIDER=postgres`).
 */
export const subscribeToChanges: Subscribe =
  DB_PROVIDER === "postgres" ? subscribePostgres : subscribeAppwrite;
