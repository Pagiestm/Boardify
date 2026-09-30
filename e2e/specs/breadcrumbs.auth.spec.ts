import { test, expect } from "@playwright/test";

import { createProject, gotoTasks, gotoWorkspace } from "../helpers";

test.describe("Fil d'Ariane", () => {
  test("il n'apparaît pas sur l'accueil de l'espace", async ({ page }) => {
    await gotoWorkspace(page);

    await expect(page.getByRole("navigation", { name: "Fil d'Ariane" })).toHaveCount(0);
  });

  test("il situe la vue des tâches", async ({ page }) => {
    await gotoTasks(page);

    const crumbs = page.getByRole("navigation", { name: "Fil d'Ariane" });
    await expect(crumbs).toBeVisible();
    await expect(crumbs.getByRole("link", { name: "Accueil" })).toBeVisible();
    await expect(crumbs.getByText("Mes tâches")).toBeVisible();
  });

  test("il nomme le projet ouvert et ramène à l'accueil", async ({ page }) => {
    await gotoWorkspace(page);
    const name = await createProject(page);

    const crumbs = page.getByRole("navigation", { name: "Fil d'Ariane" });
    await expect(crumbs.getByText(name)).toBeVisible();

    await crumbs.getByRole("link", { name: "Accueil" }).click();
    await expect(page).toHaveURL(/\/workspaces\/(?!create)[^/]+$/);
  });
});
