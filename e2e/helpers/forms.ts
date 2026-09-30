import { expect, type Locator } from "@playwright/test";

export const selectFirstOption = async (scope: Locator, label: string) => {
  await scope.getByLabel(label).click();
  const option = scope.page().getByRole("option").first();
  await expect(option).toBeVisible();
  await option.click();
};

export const pickToday = async (scope: Locator) => {
  await scope.getByRole("button", { name: "Choisir une date" }).click();
  const grid = scope.page().getByRole("grid");
  await expect(grid).toBeVisible();
  await grid.getByText(String(new Date().getDate()), { exact: true }).first().click();
  await expect(grid).toBeHidden();
};

export const expectDialogClosed = async (dialog: Locator) =>
  expect(dialog).toBeHidden({ timeout: 30_000 });

export const selectOptionByName = async (scope: Locator, label: string, name: string) => {
  await scope.getByLabel(label).click();
  const option = scope.page().getByRole("option").filter({ hasText: name }).first();
  await expect(option).toBeVisible();
  await option.click();
};
