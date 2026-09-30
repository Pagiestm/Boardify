import { test, expect } from "@playwright/test";

import { createProject, createTask, gotoTasks, gotoWorkspace } from "../helpers";

test.describe("Graphiques du tableau de bord", () => {
  test("la répartition par statut reflète les tâches existantes", async ({ page }) => {
    await gotoWorkspace(page);
    await createProject(page);
    await gotoTasks(page);
    await createTask(page);
    await gotoWorkspace(page);

    const card = page.getByRole("region").filter({ hasText: "Répartition par statut" });
    await expect(card).toBeVisible();
    await expect(card.getByText(/tâches? au total/)).toBeVisible();

    const bar = card.getByRole("img");
    await expect(bar).toHaveAttribute("aria-label", /Backlog \d+/);

    await expect(card.getByText("Backlog")).toBeVisible();
  });

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

  test("les deux graphiques restent lisibles en thème sombre", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await gotoWorkspace(page);

    await expect(
      page.getByRole("region").filter({ hasText: "Répartition par statut" }),
    ).toBeVisible();
    await expect(page.getByRole("region").filter({ hasText: "Charge par personne" })).toBeVisible();
  });
});
