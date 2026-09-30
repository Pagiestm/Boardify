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
  await expect(page.getByRole("tab", { name: "Kanban" })).toBeVisible();
};

export const workspaceIdFromUrl = (page: Page) => {
  const match = /\/workspaces\/([^/?]+)/.exec(page.url());
  if (!match) throw new Error(`Aucun espace de travail dans l'URL : ${page.url()}`);
  return match[1];
};
