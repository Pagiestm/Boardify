import { expect, type Locator } from "@playwright/test";

/** Choisit la première option d'un Select Radix repéré par son libellé. */
export const selectFirstOption = async (scope: Locator, label: string) => {
  await scope.getByLabel(label).click();
  const option = scope.page().getByRole("option").first();
  await expect(option).toBeVisible();
  await option.click();
};

/** Ouvre le sélecteur de date et choisit le jour courant. */
export const pickToday = async (scope: Locator) => {
  await scope.getByRole("button", { name: "Choisir une date" }).click();
  const grid = scope.page().getByRole("grid");
  await expect(grid).toBeVisible();
  // react-day-picker rend chaque jour dans un <td> : on vise le libellé exact.
  await grid.getByText(String(new Date().getDate()), { exact: true }).first().click();
  await expect(grid).toBeHidden();
};

/** Attend la fermeture d'une modale après une mutation réussie. */
export const expectDialogClosed = async (dialog: Locator) =>
  expect(dialog).toBeHidden({ timeout: 30_000 });
