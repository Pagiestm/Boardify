import { expect, type Page } from "@playwright/test";

import { uniqueName } from "./data";

export const openCreateProject = async (page: Page) => {
  await page.getByRole("complementary").getByLabel("Créer un projet").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
};

export const createProject = async (page: Page) => {
  const name = uniqueName("Projet");
  const dialog = await openCreateProject(page);
  await dialog.getByLabel("Nom du projet").fill(name);
  await dialog.getByRole("button", { name: "Créer", exact: true }).click();
  await page.waitForURL(/\/projects\/[^/]+$/, { timeout: 30_000 });
  return name;
};
