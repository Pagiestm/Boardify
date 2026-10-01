import { test, expect } from "@playwright/test";

import {
  createIsolatedWorkspace,
  createProject,
  createTask,
  gotoIsolatedTasks,
  gotoProjectKanban,
} from "../helpers";

test.describe("Duplication de tâche", () => {
  test("une tâche dupliquée apparaît avec le suffixe (copie)", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    const projectName = await createProject(page);
    const projectUrl = page.url();
    await gotoIsolatedTasks(page, workspaceId);
    const name = await createTask(page, projectName);

    await gotoProjectKanban(page, projectUrl);
    const card = page.locator("[data-rfd-drag-handle-draggable-id]").filter({ hasText: name });
    await expect(card).toBeVisible();

    await card.getByRole("button", { name: "Actions de la tâche" }).click();
    await page.getByRole("menuitem", { name: "Dupliquer" }).click();

    await expect(page.getByText(`${name} (copie)`)).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(name, { exact: true })).toBeVisible();
  });

  test("la copie conserve le statut de l'originale", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    const projectName = await createProject(page);
    const projectUrl = page.url();
    await gotoIsolatedTasks(page, workspaceId);
    const name = await createTask(page, projectName);

    await gotoProjectKanban(page, projectUrl);
    const original = page.locator("[data-rfd-drag-handle-draggable-id]").filter({ hasText: name });
    await original.getByRole("button", { name: "Actions de la tâche" }).click();
    await page.getByRole("menuitem", { name: "Dupliquer" }).click();

    const copy = page
      .locator("[data-rfd-drag-handle-draggable-id]")
      .filter({ hasText: `${name} (copie)` });
    await expect(copy).toBeVisible({ timeout: 30_000 });

    const column = page
      .locator("[data-rfd-droppable-id]")
      .filter({ hasNot: page.locator("[data-rfd-droppable-id]") })
      .filter({ has: original });
    await expect(column.filter({ has: copy })).toHaveCount(1);
  });
});
