import { test, expect, type APIRequestContext } from "@playwright/test";

import { createIsolatedWorkspace, createProject, uniqueName } from "../helpers";

const createDatedTask = async (
  request: APIRequestContext,
  workspaceId: string,
  projectId: string,
  memberId: string,
  startOffset: number,
  dueOffset: number,
  status = "BACKLOG",
) => {
  const name = uniqueName("Tâche");
  const response = await request.post("/api/tasks", {
    data: {
      name,
      status,
      workspaceId,
      projectId,
      assigneeId: memberId,
      priority: "HIGH",
      startDate: new Date(Date.now() + startOffset * 86_400_000).toISOString(),
      dueDate: new Date(Date.now() + dueOffset * 86_400_000).toISOString(),
    },
  });

  expect(response.status()).toBe(200);
  return name;
};

test.describe("Frise", () => {
  test("elle place une barre par tâche datée", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    await createProject(page);
    const projectId = page.url().split("/projects/")[1];
    const members = await (await request.get(`/api/members?workspaceId=${workspaceId}`)).json();
    const memberId = members.data.documents[0].$id;

    const first = await createDatedTask(request, workspaceId, projectId, memberId, 0, 3);
    const second = await createDatedTask(request, workspaceId, projectId, memberId, 5, 9);

    await page.goto(`/workspaces/${workspaceId}/tasks?task-view=gantt`);
    await expect(page.getByRole("tab", { name: "Frise" })).toBeVisible({ timeout: 30_000 });
    await page.waitForLoadState("networkidle");

    await expect(page.getByRole("button", { name: first })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("button", { name: second })).toBeVisible();
  });

  test("une tâche de la frise ouvre son détail", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    await createProject(page);
    const projectId = page.url().split("/projects/")[1];
    const members = await (await request.get(`/api/members?workspaceId=${workspaceId}`)).json();
    const memberId = members.data.documents[0].$id;

    const name = await createDatedTask(request, workspaceId, projectId, memberId, 0, 2);

    await page.goto(`/workspaces/${workspaceId}/tasks?task-view=gantt`);
    await expect(page.getByRole("button", { name })).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name }).click();

    await expect(page).toHaveURL(/\/tasks\/[^/]+$/, { timeout: 30_000 });
  });

  test("sans tâche datée elle le dit", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);

    await page.goto(`/workspaces/${workspaceId}/tasks?task-view=gantt`);
    await expect(page.getByRole("tab", { name: "Frise" })).toBeVisible({ timeout: 30_000 });

    await expect(page.getByText(/Aucune tâche datée/)).toBeVisible({ timeout: 30_000 });
  });

  test("le formulaire demande une période", async ({ page, request }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    await createProject(page);

    await page.getByRole("button", { name: "Nouvelle tâche" }).first().click();
    const dialog = page.getByRole("dialog").first();

    await expect(dialog.getByText("Période", { exact: true })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Choisir une période" })).toBeVisible();
    await expect(dialog.getByText("Date d'échéance")).toHaveCount(0);
  });

  test("une tâche en retard est signalée et une tâche terminée est barrée", async ({
    page,
    request,
  }) => {
    const workspaceId = await createIsolatedWorkspace(request);
    await page.goto(`/workspaces/${workspaceId}`);
    await createProject(page);
    const projectId = page.url().split("/projects/")[1];
    const members = await (await request.get(`/api/members?workspaceId=${workspaceId}`)).json();
    const memberId = members.data.documents[0].$id;

    const late = await createDatedTask(request, workspaceId, projectId, memberId, -6, -3);
    const done = await createDatedTask(request, workspaceId, projectId, memberId, -6, -3, "DONE");

    await page.goto(`/workspaces/${workspaceId}/tasks?task-view=gantt`);
    await expect(page.getByRole("tab", { name: "Frise" })).toBeVisible({ timeout: 30_000 });

    await expect(page.getByText("1 tâche en retard")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(late, { exact: true })).toHaveClass(/text-red-600/);
    await expect(page.getByText(done, { exact: true })).toHaveClass(/line-through/);
  });
});
