import { test, expect } from "@playwright/test";

import { createProject, createTask, gotoTasks, gotoWorkspace } from "../helpers";

test.describe("Kanban", () => {
  test("une tâche change de colonne au clavier et la position est persistée", async ({ page }) => {
    await gotoWorkspace(page);
    await createProject(page);
    await gotoTasks(page);
    const name = await createTask(page);

    await page.getByRole("tab", { name: "Kanban" }).click();
    const card = page.locator("[data-rfd-drag-handle-draggable-id]").filter({ hasText: name });
    await expect(card).toBeVisible();

    const bulkUpdate = page.waitForResponse(
      (response) =>
        response.url().includes("/api/tasks/bulk-update") && response.request().method() === "POST",
    );
    await card.focus();
    await page.keyboard.press("Space");
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");

    const response = await bulkUpdate;
    expect(response.status()).toBe(200);

    await page.reload();
    await expect(page.getByText(name).first()).toBeVisible();
  });
});
