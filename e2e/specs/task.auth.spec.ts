import { test, expect } from "@playwright/test";

import {
  createIsolatedWorkspace,
  createProject,
  createTask,
  gotoIsolatedTasks,
  gotoTasks,
} from "../helpers";

test.describe("Tâches", () => {
  test("les trois vues sont accessibles", async ({ page }) => {
    await gotoTasks(page);

    for (const view of ["Tableau", "Kanban", "Calendrier"]) {
      await page.getByRole("tab", { name: view }).click();
      await expect(page.getByRole("tab", { name: view })).toHaveAttribute("data-state", "active");
    }
  });

  test("les vues changent aussi au clavier", async ({ page }) => {
    await gotoTasks(page);

    await page.keyboard.press("2");
    await expect(page.getByRole("tab", { name: "Kanban" })).toHaveAttribute("data-state", "active");

    await page.keyboard.press("1");
    await expect(page.getByRole("tab", { name: "Tableau" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });

  test("on crée une tâche et elle apparaît dans la liste", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    const projectName = await createProject(page);
    await gotoIsolatedTasks(page, workspaceId);

    const name = await createTask(page, projectName);

    await expect(page.getByText(name).first()).toBeVisible({ timeout: 30_000 });
  });

  test("la vue est conservée dans l'URL", async ({ page }) => {
    await gotoTasks(page);

    await page.getByRole("tab", { name: "Kanban" }).click();
    await expect(page).toHaveURL(/task-view=kanban/);

    await page.reload();
    await expect(page.getByRole("tab", { name: "Kanban" })).toHaveAttribute("data-state", "active");
  });
});
