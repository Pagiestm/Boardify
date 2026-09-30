import { test, expect } from "@playwright/test";

import { createProject, gotoTasks, gotoWorkspace, selectFirstOption, uniqueName } from "../helpers";

test.describe("Validation des tâches", () => {
  test("une tâche sans assigné ni échéance est refusée côté client", async ({ page }) => {
    await gotoWorkspace(page);
    await createProject(page);
    await gotoTasks(page);

    // Aucune requête ne doit partir : la validation Zod bloque avant l'appel,
    // là où l'API répondait 500 sur des attributs pourtant exigés en base.
    let posted = false;
    page.on("request", (request) => {
      if (request.url().includes("/api/tasks") && request.method() === "POST") posted = true;
    });

    await page.getByRole("button", { name: "Nouvelle tâche" }).first().click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Nom de la tâche").fill(uniqueName("Tâche"));
    await selectFirstOption(dialog, "Statut");
    await selectFirstOption(dialog, "Priorité");
    await selectFirstOption(dialog, "Projet");
    await dialog.getByRole("button", { name: "Créer", exact: true }).click();

    await expect(dialog).toBeVisible();
    await expect(dialog.getByText("Requis").first()).toBeVisible();
    expect(posted).toBe(false);
  });
});
