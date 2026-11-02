"use client";

import { useSyncExternalStore } from "react";

/**
 * Suppressions de tâches en attente : la tâche disparaît tout de suite de l'écran, et la
 * suppression n'est envoyée qu'après le délai d'annulation (ou à la fermeture de la page).
 */

export const UNDO_DELAY_MS = 6_000;

interface Pending {
  timer: ReturnType<typeof setTimeout>;
  run: () => Promise<void>;
}

const pending = new Map<string, Pending>();
const EMPTY: ReadonlySet<string> = new Set();
let snapshot: ReadonlySet<string> = EMPTY;
const listeners = new Set<() => void>();

const notify = () => {
  snapshot = pending.size ? new Set(pending.keys()) : EMPTY;
  listeners.forEach((listener) => listener());
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** Envoie la suppression, même si la page est en train de se fermer. */
export const sendTaskDelete = (taskId: string) =>
  fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "DELETE",
    credentials: "same-origin",
    keepalive: true,
  });

let flushRegistered = false;
const registerFlush = () => {
  if (flushRegistered || typeof window === "undefined") return;
  flushRegistered = true;
  window.addEventListener("pagehide", () => {
    for (const [taskId, item] of pending) {
      clearTimeout(item.timer);
      void sendTaskDelete(taskId);
    }
    pending.clear();
  });
};

export const scheduleTaskDelete = (taskId: string, run: () => Promise<void>) => {
  registerFlush();
  cancelTaskDelete(taskId);
  const timer = setTimeout(() => {
    pending.delete(taskId);
    void run().finally(notify);
  }, UNDO_DELAY_MS);
  pending.set(taskId, { timer, run });
  notify();
};

/** Annule une suppression en attente ; renvoie faux s'il était trop tard. */
export const cancelTaskDelete = (taskId: string) => {
  const item = pending.get(taskId);
  if (!item) return false;
  clearTimeout(item.timer);
  pending.delete(taskId);
  notify();
  return true;
};

/** Tâches en cours de suppression, à masquer de l'affichage. */
export const usePendingTaskDeletes = () =>
  useSyncExternalStore(
    subscribe,
    () => snapshot,
    () => EMPTY,
  );
