import { expect, type Locator } from "@playwright/test";

export const selectFirstOption = async (scope: Locator, label: string) => {
  await scope.getByLabel(label).click();
  const option = scope.page().getByRole("option").first();
  await expect(option).toBeVisible();
  await option.click();
};

export const pickToday = async (scope: Locator) => {
  await scope.getByRole("button", { name: "Choisir une période" }).click();
  const page = scope.page();
  const grid = page.getByRole("grid").first();
  await expect(grid).toBeVisible();

  const today = new Date();
  const end = new Date(today);
  end.setDate(today.getDate() + 2);

  await grid.getByText(String(today.getDate()), { exact: true }).first().click();
  await page.waitForTimeout(400);
  await page.getByRole("grid").getByText(String(end.getDate()), { exact: true }).first().click();

  await expect(page.getByRole("grid")).toHaveCount(0, { timeout: 10_000 });
};

export const expectDialogClosed = async (dialog: Locator) =>
  expect(dialog).toBeHidden({ timeout: 30_000 });

export const selectOptionByName = async (scope: Locator, label: string, name: string) => {
  await scope.getByLabel(label).click();
  const option = scope.page().getByRole("option").filter({ hasText: name }).first();
  await expect(option).toBeVisible();
  await option.click();
};
