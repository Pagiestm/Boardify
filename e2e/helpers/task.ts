import { expect, type Page } from "@playwright/test";

import { uniqueName } from "./data";
import { expectDialogClosed, pickToday, selectFirstOption } from "./forms";

/**
 * Crée une tâche depuis la vue « Mes tâches » et renvoie son nom.
 *
 * Statut, priorité et projet sont requis par `createtaskSchema`. « Assigné à »
 * et « Date d'échéance » y sont facultatifs mais requis par la collection
 * Appwrite : sans eux l'API répond 500 (voir la section « Écarts connus »).
 */
export const createTask = async (page: Page) => {
  const name = uniqueName("Tâche");
  await page.getByRole("button", { name: "Nouvelle tâche" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Nom de la tâche").fill(name);
  await selectFirstOption(dialog, "Statut");
  await selectFirstOption(dialog, "Priorité");
  await selectFirstOption(dialog, "Projet");
  await selectFirstOption(dialog, "Assigné à");
  await pickToday(dialog);
  await dialog.getByRole("button", { name: "Créer", exact: true }).click();

  await expectDialogClosed(dialog);
  return name;
};
