import { expect, type Locator, type Page } from "@playwright/test";

import { uniqueName } from "./data";

export const openLabelPicker = async (scope: Locator) => {
  await scope.getByRole("button", { name: "Aucune étiquette" }).click();
  const picker = scope.page().getByRole("dialog", { name: "Étiquettes" });
  await expect(picker.getByLabel("Nom de l'étiquette")).toBeVisible();
  return picker;
};

export const createLabelInPicker = async (page: Page, picker: Locator) => {
  const name = uniqueName("Étiquette");
  await picker.getByLabel("Nom de l'étiquette").fill(name);
  await picker.getByRole("button", { name: "Ajouter l'étiquette" }).click();
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 30_000 });
  return name;
};
