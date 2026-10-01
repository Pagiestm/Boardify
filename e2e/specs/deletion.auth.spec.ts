import { test, expect } from "@playwright/test";

import { createProject, createTask, gotoProjectKanban, gotoTasks, gotoWorkspace } from "../helpers";

test.describe("Suppressions", () => {
  test("une tâche est supprimée après confirmation", async ({ page }) => {
    await gotoWorkspace(page);
    const projectName = await createProject(page);
    const projectUrl = page.url();
    await gotoTasks(page);
    const name = await createTask(page, projectName);

    await gotoProjectKanban(page, projectUrl);
    const card = page.locator("[data-rfd-drag-handle-draggable-id]").filter({ hasText: name });
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: "Actions de la tâche" }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    await page.getByRole("button", { name: "Confirmer" }).click();

    await expect(card).toBeHidden({ timeout: 30_000 });
  });

  test("la confirmation peut être annulée", async ({ page }) => {
    await gotoWorkspace(page);
    const projectName = await createProject(page);
    const projectUrl = page.url();
    await gotoTasks(page);
    const name = await createTask(page, projectName);

    await gotoProjectKanban(page, projectUrl);
    const card = page.locator("[data-rfd-drag-handle-draggable-id]").filter({ hasText: name });

    await card.getByRole("button", { name: "Actions de la tâche" }).click();
    await page.getByRole("menuitem", { name: "Supprimer" }).click();
    await page.getByRole("button", { name: "Annuler" }).click();

    await expect(card).toBeVisible();
  });

  test("un projet est supprimé depuis ses paramètres", async ({ page }) => {
    await gotoWorkspace(page);
    const name = await createProject(page);

    await page.goto(`${page.url()}/settings`);
    await page.getByRole("button", { name: "Supprimer le projet" }).click();
    await page.getByRole("button", { name: "Confirmer" }).click();

    await page.waitForURL(/\/workspaces\/[^/]+$/, { timeout: 30_000 });
    await expect(
      page.getByRole("complementary").getByRole("link").filter({ hasText: name }),
    ).toBeHidden();
  });
});
