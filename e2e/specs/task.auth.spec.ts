import { test, expect } from "@playwright/test";

import {
  createIsolatedWorkspace,
  createProject,
  createTask,
  gotoIsolatedTasks,
  gotoTasks,
} from "../helpers";

test.describe("Tâches", () => {
  test("l'espace propose le tableau et le calendrier, sans kanban", async ({ page }) => {
    await gotoTasks(page);

    for (const view of ["Tableau", "Calendrier"]) {
      await page.getByRole("tab", { name: view }).click();
      await expect(page.getByRole("tab", { name: view })).toHaveAttribute("data-state", "active");
    }

    await expect(page.getByRole("tab", { name: "Kanban" })).toHaveCount(0);
  });

  test("un projet propose les trois vues", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    await createProject(page);

    for (const view of ["Tableau", "Kanban", "Calendrier"]) {
      await page.getByRole("tab", { name: view }).click();
      await expect(page.getByRole("tab", { name: view })).toHaveAttribute("data-state", "active");
    }
  });

  test("les vues changent aussi au clavier", async ({ page }) => {
    await gotoTasks(page);

    await page.keyboard.press("3");
    await expect(page.getByRole("tab", { name: "Calendrier" })).toHaveAttribute(
      "data-state",
      "active",
    );

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

    await page.getByRole("tab", { name: "Calendrier" }).click();
    await expect(page).toHaveURL(/task-view=calendar/);

    await page.reload();
    await expect(page.getByRole("tab", { name: "Calendrier" })).toHaveAttribute(
      "data-state",
      "active",
    );
  });
});
