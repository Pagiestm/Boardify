import { test as teardown } from "@playwright/test";

import { cleanupTestData } from "../helpers/cleanup";

teardown("nettoyage des données de test", async ({ request }) => {
  const removed = await cleanupTestData(request);
  console.log(
    `Nettoyage : ${removed.workspaces} espace(s), ${removed.projects} projet(s), ${removed.tasks} tâche(s), ${removed.labels} étiquette(s).`,
  );
});
