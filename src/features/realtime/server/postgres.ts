import "server-only";

import postgres, { type Sql } from "postgres";

import { CHANGES_CHANNEL, type ChangePayload } from "@/lib/db/changes";

import { toRealtimeChange } from "./filter";
import type { RealtimeSubscriber, Subscribe } from "./types";

/** Délai avant de fermer la connexion d'écoute quand plus personne n'écoute. */
const IDLE_MS = 10_000;

interface ListenerState {
  sql: Sql | null;
  subscribers: Set<RealtimeSubscriber>;
  /** LISTEN actif : les nouveaux abonnés sont prêts tout de suite. */
  listening: boolean;
  idle?: ReturnType<typeof setTimeout>;
}

// Une seule connexion d'écoute par processus, gardée d'un rechargement à l'autre en développement.
const globalForRealtime = globalThis as typeof globalThis & { boardifyRealtime?: ListenerState };
const state = (globalForRealtime.boardifyRealtime ??= {
  sql: null,
  subscribers: new Set(),
  listening: false,
});

/** Ferme la connexion et prévient les abonnés, qui se reconnecteront et rattraperont le retard. */
const reset = () => {
  const { sql, subscribers } = state;
  state.sql = null;
  state.listening = false;
  state.subscribers = new Set();
  void sql?.end({ timeout: 1 }).catch(() => undefined);
  for (const subscriber of subscribers) subscriber.onClose();
};

const onNotify = (raw: string) => {
  let event: ChangePayload;
  try {
    event = JSON.parse(raw);
  } catch {
    return;
  }
  for (const subscriber of state.subscribers) {
    const change = toRealtimeChange(event, subscriber);
    if (change) subscriber.onChange(change);
  }
};

const onListen = () => {
  // Après une reconnexion, des changements ont pu être manqués : les abonnés repartent de zéro.
  if (state.listening) {
    reset();
    return;
  }
  state.listening = true;
  for (const subscriber of state.subscribers) subscriber.onReady();
};

const start = () => {
  // LISTEN demande une connexion directe : les poolers en mode transaction ne le gèrent pas.
  const url = process.env.DATABASE_DIRECT_URL || process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquante");

  const sql = postgres(url, { max: 1, onnotice: () => undefined });
  state.sql = sql;
  sql.listen(CHANGES_CHANNEL, onNotify, onListen).catch((error) => {
    console.error("[realtime] écoute Postgres impossible", error);
    if (state.sql === sql) reset();
  });
};

/** Source Postgres : les écritures sont annoncées par NOTIFY (voir `src/lib/db/changes.ts`). */
export const subscribePostgres: Subscribe = (subscriber) => {
  clearTimeout(state.idle);
  state.subscribers.add(subscriber);

  if (!state.sql) {
    try {
      start();
    } catch (error) {
      console.error("[realtime]", error);
      state.subscribers.delete(subscriber);
      queueMicrotask(subscriber.onClose);
      return () => undefined;
    }
  } else if (state.listening) {
    queueMicrotask(subscriber.onReady);
  }

  return () => {
    state.subscribers.delete(subscriber);
    if (state.subscribers.size > 0 || !state.sql) return;
    state.idle = setTimeout(() => {
      if (state.subscribers.size === 0) reset();
    }, IDLE_MS);
  };
};
