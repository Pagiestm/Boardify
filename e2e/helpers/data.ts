/**
 * Toutes les données créées par les tests portent ce marqueur : le teardown
 * s'en sert pour ne supprimer qu'elles et jamais des données réelles.
 * Ne jamais l'assouplir — c'est le seul garde-fou entre les tests et la base.
 */
export const E2E_MARKER = "[E2E]";

/** Nom unique et traçable : les specs tournent en parallèle sur un backend partagé. */
export const uniqueName = (prefix: string) =>
  `${E2E_MARKER} ${prefix} ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;

/** Nom de l'espace de travail créé par le setup quand le compte est vierge. */
export const WORKSPACE_NAME = `${E2E_MARKER} Espace de travail`;
