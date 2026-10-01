import { expect, type APIRequestContext, type Page } from "@playwright/test";

import { uniqueName } from "./data";

export const createIsolatedWorkspace = async (request: APIRequestContext) => {
  const response = await request.post("/api/workspaces", {
    multipart: { name: uniqueName("Espace") },
  });

  expect(response.status()).toBe(200);
  return (await response.json()).data.$id as string;
};

export const gotoIsolatedTasks = async (page: Page, workspaceId: string) => {
  await page.goto(`/workspaces/${workspaceId}/tasks`);
  await expect(page.getByRole("tab", { name: "Tableau" })).toBeVisible();
  await page.waitForLoadState("networkidle");
};
