/**
 * Outils de timeline des démos du guide. Chaque démo est une fonction pure du temps
 * `t` (en ms) : on peut donc lire, mettre en pause ou se déplacer n'importe où.
 */

/** Dimensions logiques de la scène ; le lecteur la met à l'échelle de son conteneur. */
export const STAGE_WIDTH = 880;
export const STAGE_HEIGHT = 550;

export const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

export const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

export const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

export const easeOut = (x: number) => 1 - (1 - x) ** 3;

/** Avancement de 0 à 1 entre `start` et `end`. */
export const progress = (t: number, start: number, end: number) =>
  end <= start ? Number(t >= end) : clamp((t - start) / (end - start));

/** Valeur interpolée entre `from` et `to` pendant [start, end]. */
export const tween = (
  t: number,
  start: number,
  end: number,
  from: number,
  to: number,
  ease: (x: number) => number = easeInOut,
) => lerp(from, to, ease(progress(t, start, end)));

/** Apparition en fondu (opacité 0 → 1) à partir de `start`, sur `duration` ms. */
export const fadeIn = (t: number, start: number, duration = 250) =>
  easeOut(progress(t, start, start + duration));

/** Vrai pendant [start, end[. */
export const between = (t: number, start: number, end = Infinity) => t >= start && t < end;

/** Texte tapé au clavier à partir de `start`, à `perSecond` caractères par seconde. */
export const typed = (t: number, start: number, text: string, perSecond = 16) =>
  text.slice(0, Math.max(0, Math.floor(((t - start) / 1000) * perSecond)));

/** Durée nécessaire pour taper `text`, utile pour enchaîner les étapes. */
export const typingDuration = (text: string, perSecond = 16) =>
  Math.ceil((text.length / perSecond) * 1000);

/**
 * Position cible du curseur ou de la caméra : un point de la scène, ou un élément
 * marqué `data-demo="…"` dont le centre est mesuré à l'affichage.
 */
export type DemoTarget = { x: number; y: number } | { target: string; dx?: number; dy?: number };

/** Déplacement du curseur vers la cible, à partir de `at` et pendant `duration` ms (600 par défaut). */
export type CursorKey = DemoTarget & { at: number; duration?: number };

/** Cadrage de la caméra sur la cible, au niveau de zoom `zoom` (1 = toute la scène, 900 ms par défaut). */
export type CameraKey = DemoTarget & { at: number; zoom: number; duration?: number };

export interface DemoStep {
  at: number;
  label: string;
}

export interface DemoKeystroke {
  at: number;
  keys: string;
  duration?: number;
}

export interface DemoScene {
  id: string;
  title: string;
  duration: number;
  /** Étapes affichées sous la vidéo et en sous-titre. */
  steps: DemoStep[];
  cursor: CursorKey[];
  camera: CameraKey[];
  /** Instants des clics (onde sous le curseur). */
  clicks?: number[];
  /** Touches affichées à l'écran (« N », « ⌘K »…). */
  keystrokes?: DemoKeystroke[];
  render: (t: number) => React.ReactNode;
}
