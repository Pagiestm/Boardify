import { test, expect } from "@playwright/test";

import {
  createProject,
  createTask,
  gotoTasks,
  gotoWorkspace,
  workspaceIdFromUrl,
} from "../helpers";

test.describe("Suppression en cascade", () => {
  test("supprimer un projet supprime ses tâches", async ({ page, request }) => {
    await gotoWorkspace(page);
    const workspaceId = workspaceIdFromUrl(page);
    const projectName = await createProject(page);
    const projectUrl = page.url();
    const projectId = projectUrl.split("/projects/")[1];

    await gotoTasks(page);
    await createTask(page, projectName);

    const before = await (
      await request.get(`/api/tasks?workspaceId=${workspaceId}&projectId=${projectId}`)
    ).json();
    expect(before.data.total).toBeGreaterThan(0);

    await page.goto(`${projectUrl}/settings`);
    await page.getByRole("button", { name: "Supprimer le projet" }).click();
    await page.getByRole("button", { name: "Confirmer" }).click();
    await page.waitForURL(/\/workspaces\/[^/]+$/, { timeout: 30_000 });

    const after = await (
      await request.get(`/api/tasks?workspaceId=${workspaceId}&projectId=${projectId}`)
    ).json();
    expect(after.data.total).toBe(0);
  });
});
