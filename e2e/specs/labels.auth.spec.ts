import { test, expect } from "@playwright/test";

import {
  createProject,
  createTaskWithLabel,
  gotoTasks,
  gotoWorkspace,
  openLabelPicker,
  uniqueName,
  workspaceIdFromUrl,
} from "../helpers";

test.describe("Étiquettes", () => {
  test("une étiquette créée s'applique à la tâche et s'affiche sur sa carte", async ({ page }) => {
    await gotoWorkspace(page);
    const projectName = await createProject(page);
    await gotoTasks(page);

    const { name, labelName } = await createTaskWithLabel(page, projectName);

    await page.getByRole("tab", { name: "Kanban" }).click();
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
});
