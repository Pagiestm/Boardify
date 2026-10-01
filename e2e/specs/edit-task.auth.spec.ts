import { test, expect } from "@playwright/test";

import {
  createIsolatedWorkspace,
  createProject,
  createTask,
  expectDialogClosed,
  gotoIsolatedTasks,
  gotoProjectKanban,
} from "../helpers";

test.describe("Modification de tâche", () => {
  test("enregistrer un nouveau nom met la tâche à jour", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    const projectName = await createProject(page);
    const projectUrl = page.url();
    await gotoIsolatedTasks(page, workspaceId);
    const name = await createTask(page, projectName);

    await gotoProjectKanban(page, projectUrl);
    const card = page.locator("[data-rfd-drag-handle-draggable-id]").filter({ hasText: name });
    await card.getByRole("button", { name: "Actions de la tâche" }).click();
    await page.getByRole("menuitem", { name: "Modifier" }).click();

    const dialog = page.getByRole("dialog").first();
    await expect(dialog).toBeVisible();
    const renamed = `${name} modifiée`;
    await dialog.getByLabel("Nom de la tâche").fill(renamed);
    await dialog.getByRole("button", { name: "Enregistrer" }).click();

    await expectDialogClosed(dialog);
    await expect(page.getByText(renamed).first()).toBeVisible({ timeout: 30_000 });
  });
});
