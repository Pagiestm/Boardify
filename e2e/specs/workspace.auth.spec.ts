import { test, expect } from "@playwright/test";

import { gotoWorkspace } from "../helpers";

test.describe("Espace de travail", () => {
  test("le tableau de bord s'ouvre sur un espace de travail", async ({ page }) => {
    await gotoWorkspace(page);

    await expect(page).toHaveURL(/\/workspaces\/(?!create)[^/]+/);
    await expect(page.getByRole("main")).toBeVisible();
  });

  test("la barre latérale donne accès aux tâches", async ({ page }) => {
    await gotoWorkspace(page);

    await page.getByRole("link", { name: "Mes tâches" }).click();

    await expect(page).toHaveURL(/\/tasks$/);
  });

  test("la palette de commandes s'ouvre au clavier", async ({ page }) => {
    await gotoWorkspace(page);

    await page.keyboard.press("ControlOrMeta+k");

    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("le raccourci « g t » navigue vers les tâches", async ({ page }) => {
    await gotoWorkspace(page);

    await page.keyboard.press("g");
    await page.keyboard.press("t");

    await expect(page).toHaveURL(/\/tasks$/);
  });
});
