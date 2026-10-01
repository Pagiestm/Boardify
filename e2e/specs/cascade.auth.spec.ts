import { test, expect } from "@playwright/test";

import { createIsolatedWorkspace, createProject, createTask, gotoIsolatedTasks } from "../helpers";

test.describe("Suppression en cascade", () => {
  test("supprimer un projet supprime ses tâches", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    const projectName = await createProject(page);
    const projectUrl = page.url();
    const projectId = projectUrl.split("/projects/")[1];

    await gotoIsolatedTasks(page, workspaceId);
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
