import { test, expect } from "@playwright/test";

import { createProject, createTask, gotoTasks, gotoWorkspace } from "../helpers";

test.describe("Graphiques du tableau de bord", () => {
  test("la charge par personne liste les tâches non terminées", async ({ page }) => {
    await gotoWorkspace(page);
    await createProject(page);
    await gotoTasks(page);
    await createTask(page);
    await gotoWorkspace(page);

    const card = page.getByRole("region").filter({ hasText: "Charge par personne" });
    await expect(card).toBeVisible();
    await expect(card.getByText("Tâches non terminées")).toBeVisible();

    const rows = card.getByRole("listitem");
    await expect(rows.first()).toBeVisible();
  });

  test("le graphique reste lisible en thème sombre", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await gotoWorkspace(page);

    await expect(page.getByRole("region").filter({ hasText: "Charge par personne" })).toBeVisible();
  });

  test("l'espace n'affiche plus de répartition par statut", async ({ page }) => {
    await gotoWorkspace(page);

    await expect(page.getByText("Répartition par statut")).toHaveCount(0);
  });
});
