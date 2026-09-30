import { test as teardown } from "@playwright/test";

import { cleanupTestData } from "../helpers/cleanup";

/**
 * Exécuté après la suite : sans lui, chaque run laisserait derrière lui un
 * espace de travail, des projets et des tâches de plus dans la base.
 */
teardown("nettoyage des données de test", async ({ request }) => {
  const removed = await cleanupTestData(request);
  console.log(
    `Nettoyage : ${removed.workspaces} espace(s), ${removed.projects} projet(s), ${removed.tasks} tâche(s).`,
  );
});
