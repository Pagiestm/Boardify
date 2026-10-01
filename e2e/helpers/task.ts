import { expect, type Page } from "@playwright/test";

import { uniqueName } from "./data";
import { createLabelInPicker, openLabelPicker } from "./label";
import { expectDialogClosed, pickToday, selectFirstOption, selectOptionByName } from "./forms";

export const createTask = async (page: Page, projectName?: string) => {
  const name = uniqueName("Tâche");
  await page.getByRole("button", { name: "Nouvelle tâche" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Nom de la tâche").fill(name);
  await selectFirstOption(dialog, "Statut");
  await selectFirstOption(dialog, "Priorité");
  if (projectName) {
    await selectOptionByName(dialog, "Projet", projectName);
  } else {
    await selectFirstOption(dialog, "Projet");
  }
  await selectFirstOption(dialog, "Assigné à");
  await pickToday(dialog);
  await dialog.getByRole("button", { name: "Créer", exact: true }).click();

  await expectDialogClosed(dialog);
  return name;
};

export const createTaskWithLabel = async (page: Page, projectName?: string) => {
  const name = uniqueName("Tâche");
  await page.getByRole("button", { name: "Nouvelle tâche" }).first().click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Nom de la tâche").fill(name);
  await selectFirstOption(dialog, "Statut");
  await selectFirstOption(dialog, "Priorité");
  if (projectName) {
    await selectOptionByName(dialog, "Projet", projectName);
  } else {
    await selectFirstOption(dialog, "Projet");
  }
  await selectFirstOption(dialog, "Assigné à");
  await pickToday(dialog);

  const picker = await openLabelPicker(dialog);
  const labelName = await createLabelInPicker(page, picker);
  await page.keyboard.press("Escape");
  await expect(picker).toBeHidden();

  await dialog.getByRole("button", { name: "Créer", exact: true }).click();
  await expectDialogClosed(dialog);

  return { name, labelName };
};
