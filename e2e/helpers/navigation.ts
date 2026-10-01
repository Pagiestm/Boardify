import { expect, type Page } from "@playwright/test";

export const gotoWorkspace = async (page: Page) => {
  await page.goto("/dashboard");
  await page.waitForURL(/\/workspaces\/(?!create)[^/]+/);
  await expect(page.getByRole("link", { name: "Mes tâches" })).toBeVisible();
  await page.waitForLoadState("networkidle");
};

export const gotoTasks = async (page: Page) => {
  await gotoWorkspace(page);
  await page.getByRole("link", { name: "Mes tâches" }).click();
  await page.waitForURL(/\/tasks$/);
  await expect(page.getByRole("tab", { name: "Tableau" })).toBeVisible();
};

export const workspaceIdFromUrl = (page: Page) => {
  const match = /\/workspaces\/([^/?]+)/.exec(page.url());
  if (!match) throw new Error(`Aucun espace de travail dans l'URL : ${page.url()}`);
  return match[1];
};

export const gotoProjectKanban = async (page: Page, projectUrl: string) => {
  await page.goto(`${projectUrl}?task-view=kanban`);
  await expect(page.getByRole("tab", { name: "Kanban" })).toBeVisible({ timeout: 30_000 });
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible({ timeout: 30_000 });
};
