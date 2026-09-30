import { test, expect } from "@playwright/test";

import { createProject, gotoWorkspace, openCreateProject } from "../helpers";

test.describe("Projets", () => {
  test("on crée un projet depuis la barre latérale", async ({ page }) => {
    await gotoWorkspace(page);

    const name = await createProject(page);

    await expect(page).toHaveURL(/\/projects\/[^/]+$/);
    await expect(page.getByText(name).first()).toBeVisible();
  });

  test("le projet créé apparaît dans la barre latérale", async ({ page }) => {
    await gotoWorkspace(page);

    const name = await createProject(page);

    await expect(
      page.getByRole("complementary").getByRole("link").filter({ hasText: name }),
    ).toBeVisible();
  });

  test("un nom vide est refusé", async ({ page }) => {
    await gotoWorkspace(page);

    const dialog = await openCreateProject(page);
    await dialog.getByRole("button", { name: "Créer", exact: true }).click();

    await expect(dialog).toBeVisible();
    await expect(page).not.toHaveURL(/\/projects\//);
  });
});
