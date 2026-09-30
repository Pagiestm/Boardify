import { expect, type Page } from "@playwright/test";

/** Ouvre l'espace de travail de l'utilisateur et attend que le layout soit interactif. */
export const gotoWorkspace = async (page: Page) => {
  await page.goto("/dashboard");
  await page.waitForURL(/\/workspaces\/(?!create)[^/]+/);
  await expect(page.getByRole("link", { name: "Mes tâches" })).toBeVisible();
  // Les raccourcis globaux ne sont posés qu'après hydratation du layout.
  await page.waitForLoadState("networkidle");
};

/** Ouvre la vue « Mes tâches » de l'espace de travail. */
export const gotoTasks = async (page: Page) => {
  await gotoWorkspace(page);
  await page.getByRole("link", { name: "Mes tâches" }).click();
  await page.waitForURL(/\/tasks$/);
  await expect(page.getByRole("tab", { name: "Kanban" })).toBeVisible();
};

/** Identifiant de l'espace de travail courant, lu dans l'URL. */
export const workspaceIdFromUrl = (page: Page) => {
  const match = /\/workspaces\/([^/?]+)/.exec(page.url());
  if (!match) throw new Error(`Aucun espace de travail dans l'URL : ${page.url()}`);
  return match[1];
};
