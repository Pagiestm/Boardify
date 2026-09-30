import { test, expect } from "@playwright/test";

import { createProject, createTask, gotoTasks, gotoWorkspace } from "../helpers";

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

  test("on crée une tâche et elle apparaît dans la liste", async ({ page }) => {
    await gotoWorkspace(page);
    await createProject(page);
    await gotoTasks(page);

    const name = await createTask(page);

    await expect(page.getByText(name).first()).toBeVisible();
  });

  test("la vue est conservée dans l'URL", async ({ page }) => {
    await gotoTasks(page);

    await page.getByRole("tab", { name: "Kanban" }).click();
    await expect(page).toHaveURL(/task-view=kanban/);

    await page.reload();
    await expect(page.getByRole("tab", { name: "Kanban" })).toHaveAttribute("data-state", "active");
  });
});
