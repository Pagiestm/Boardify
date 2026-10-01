import { test, expect } from "@playwright/test";

import {
  createIsolatedWorkspace,
  createProject,
  createTask,
  gotoIsolatedTasks,
  gotoTasks,
  gotoWorkspace,
} from "../helpers";

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

  test("les échéances se répartissent par urgence", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    const projectName = await createProject(page);
    await gotoIsolatedTasks(page, workspaceId);
    await createTask(page, projectName);

    await page.goto(`/workspaces/${workspaceId}`);
    const card = page.getByRole("region").filter({ hasText: "Échéances" });

    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(card.getByText(/tâches? datées?/)).toBeVisible();
    await expect(card.getByRole("img")).toHaveAttribute("aria-label", /Échéances :/);
    await expect(card.getByText("Aujourd'hui")).toBeVisible();
  });

  test("les tâches se répartissent par projet", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    const projectName = await createProject(page);
    await gotoIsolatedTasks(page, workspaceId);
    await createTask(page, projectName);

    await page.goto(`/workspaces/${workspaceId}`);
    const card = page.getByRole("region").filter({ hasText: "Tâches par projet" });

    await expect(card).toBeVisible({ timeout: 30_000 });
    await expect(card.getByText(projectName)).toBeVisible();
    await expect(card.getByRole("listitem").first()).toBeVisible();
  });

  test("les couleurs d'échéance sont définies au niveau du document", async ({ page }) => {
    await gotoWorkspace(page);

    const missing = await page.evaluate(() => {
      const styles = getComputedStyle(document.documentElement);
      return ["overdue", "today", "week", "later"].filter(
        (name) => !styles.getPropertyValue(`--color-due-${name}`).trim(),
      );
    });

    expect(missing).toEqual([]);
  });
});
