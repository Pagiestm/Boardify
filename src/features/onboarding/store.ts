"use client";

import { useMemo, useSyncExternalStore } from "react";

/**
 * État de l'accompagnement : visite en cours, visites déjà vues et étapes « Premiers pas »
 * franchies. Ce qui doit durer est gardé dans le navigateur, par utilisateur.
 */

const EVENT = "boardify:onboarding";

let activeTour: string | null = null;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((listener) => listener());

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  window.addEventListener(EVENT, listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener(EVENT, listener);
  };
};

export const startTour = (id: string) => {
  activeTour = id;
  notify();
};

export const stopTour = () => {
  activeTour = null;
  notify();
};

export const useActiveTour = () =>
  useSyncExternalStore(
    subscribe,
    () => activeTour,
    () => null,
  );

const read = (key: string): string[] => {
  try {
    const value = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
};

const add = (key: string, value: string) => {
  try {
    const values = read(key);
    if (values.includes(value)) return;
    localStorage.setItem(key, JSON.stringify([...values, value]));
    window.dispatchEvent(new Event(EVENT));
  } catch {
    // Stockage indisponible : rien n'est retenu.
  }
};

const toursKey = (userId: string) => `boardify:tours:${userId}`;
const stepsKey = (userId: string) => `boardify:onboarding:${userId}`;

export const hasSeenTour = (userId: string, tourId: string) =>
  read(toursKey(userId)).includes(tourId);

export const markTourSeen = (userId: string, tourId: string) => add(toursKey(userId), tourId);

/** Étapes franchies hors des données de l'espace (palette ouverte, carte masquée…). */
export const markOnboarding = (userId: string, step: string) => add(stepsKey(userId), step);

const parse = (value: string | undefined): string[] => {
  try {
    const list = JSON.parse(value || "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};

/** Visites vues et étapes franchies par l'utilisateur, mises à jour en direct. */
export const useOnboardingFlags = (userId: string | undefined) => {
  const raw = useSyncExternalStore(
    subscribe,
    () => {
      if (!userId) return "";
      try {
        return JSON.stringify([
          localStorage.getItem(toursKey(userId)),
          localStorage.getItem(stepsKey(userId)),
        ]);
      } catch {
        return "";
      }
    },
    () => "",
  );
  return useMemo(() => {
    const [tours, steps] = raw ? (JSON.parse(raw) as (string | null)[]) : [];
    return { tours: parse(tours ?? undefined), steps: parse(steps ?? undefined) };
  }, [raw]);
};
