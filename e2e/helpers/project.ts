import { expect, type Page } from "@playwright/test";

import { uniqueName } from "./data";

/**
 * Plusieurs boutons « Créer un projet » coexistent (barre latérale et page) :
 * on passe toujours par celui de la barre latérale, présent sur toutes les vues.
 */
export const openCreateProject = async (page: Page) => {
  await page.getByRole("complementary").getByLabel("Créer un projet").click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  return dialog;
};

/** Crée un projet et renvoie son nom une fois la redirection effectuée. */
export const createProject = async (page: Page) => {
  const name = uniqueName("Projet");
  const dialog = await openCreateProject(page);
  await dialog.getByLabel("Nom du projet").fill(name);
  await dialog.getByRole("button", { name: "Créer", exact: true }).click();
  await page.waitForURL(/\/projects\/[^/]+$/, { timeout: 30_000 });
  return name;
};
