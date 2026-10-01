import { test, expect } from "@playwright/test";

import {
  createProject,
  createTask,
  createTaskWithLabel,
  gotoProjectKanban,
  gotoTasks,
  gotoWorkspace,
  createIsolatedWorkspace,
  gotoIsolatedTasks,
  openLabelPicker,
  uniqueName,
  workspaceIdFromUrl,
} from "../helpers";

test.describe("Étiquettes", () => {
  test("une étiquette créée s'applique à la tâche et s'affiche sur sa carte", async ({ page }) => {
    await gotoWorkspace(page);
    const projectName = await createProject(page);
    const projectUrl = page.url();
    await gotoTasks(page);

    const { name, labelName } = await createTaskWithLabel(page, projectName);

    await gotoProjectKanban(page, projectUrl);
    const card = page.locator("[data-rfd-drag-handle-draggable-id]").filter({ hasText: name });
    await expect(card).toBeVisible();
    await expect(card.getByText(labelName)).toBeVisible();
  });

  test("l'étiquette reste disponible pour une autre tâche", async ({ page }) => {
    await gotoWorkspace(page);
    const projectName = await createProject(page);
    await gotoTasks(page);

    const { labelName } = await createTaskWithLabel(page, projectName);

    await page.getByRole("button", { name: "Nouvelle tâche" }).first().click();
    const picker = await openLabelPicker(page.getByRole("dialog").first());

    await expect(picker.getByText(labelName)).toBeVisible();
  });

  test("deux étiquettes ne peuvent pas porter le même nom", async ({ page, request }) => {
    await gotoWorkspace(page);
    const workspaceId = workspaceIdFromUrl(page);
    const name = uniqueName("Étiquette");

    const first = await request.post("/api/labels", {
      data: { name, color: "blue", workspaceId },
    });
    expect(first.status()).toBe(200);

    const second = await request.post("/api/labels", {
      data: { name, color: "rose", workspaceId },
    });
    expect(second.status()).toBe(409);
    expect((await second.json()).error).toBe("Une étiquette porte déjà ce nom");
  });

  test("supprimer une étiquette la retire des tâches qui la portaient", async ({
    page,
    request,
  }) => {
    await gotoWorkspace(page);
    const projectName = await createProject(page);
    await gotoTasks(page);

    const { name, labelName } = await createTaskWithLabel(page, projectName);
    const workspaceId = workspaceIdFromUrl(page);

    const labels = await (await request.get(`/api/labels?workspaceId=${workspaceId}`)).json();
    const label = labels.data.documents.find((item: { name: string }) => item.name === labelName);
    expect(label).toBeTruthy();

    const deleted = await request.delete(`/api/labels/${label.$id}`);
    expect(deleted.status()).toBe(200);

    const tasks = await (await request.get(`/api/tasks?workspaceId=${workspaceId}`)).json();
    const task = tasks.data.documents.find((item: { name: string }) => item.name === name);
    expect(task.labelIds).not.toContain(label.$id);
  });

  test("des exemples sont proposés quand aucune étiquette n'existe", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await gotoIsolatedTasks(page, workspaceId);
    await page.getByRole("button", { name: "Nouvelle tâche" }).first().click();
    const picker = await openLabelPicker(page.getByRole("dialog").first());

    for (const name of ["bug", "urgent", "évolution"]) {
      await expect(picker.getByRole("button", { name })).toBeVisible();
    }

    await picker.getByRole("button", { name: "bug" }).click();

    await expect(picker.getByText("bug")).toBeVisible({ timeout: 30_000 });
    await expect(picker.getByRole("button", { name: "urgent" })).toBeHidden();
  });

  test("le détail d'une tâche affiche ses étiquettes", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    const projectName = await createProject(page);
    const projectUrl = page.url();
    await gotoIsolatedTasks(page, workspaceId);

    const { name, labelName } = await createTaskWithLabel(page, projectName);

    await gotoProjectKanban(page, projectUrl);
    const card = page.locator("[data-rfd-drag-handle-draggable-id]").filter({ hasText: name });
    await card.getByRole("button", { name: "Actions de la tâche" }).click();
    await page.getByRole("menuitem", { name: "Voir la tâche" }).click();
    await page.waitForURL(/\/tasks\/[^/]+$/, { timeout: 30_000 });

    await expect(page.getByText("Étiquettes")).toBeVisible();
    await expect(page.getByText(labelName).first()).toBeVisible();
  });

  test("le filtre par étiquette ne garde que les tâches concernées", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    const projectName = await createProject(page);
    await gotoIsolatedTasks(page, workspaceId);

    const withLabel = await createTaskWithLabel(page, projectName);
    const without = await createTask(page, projectName);

    await expect(page.getByText(without).first()).toBeVisible();

    await page.getByLabel("Filtrer par étiquette").click();
    await page.getByRole("option").filter({ hasText: withLabel.labelName }).click();

    await expect(page).toHaveURL(/labelId=/);
    await expect(page.getByText(withLabel.name).first()).toBeVisible();
    await expect(page.getByText(without)).toHaveCount(0);
  });
});
