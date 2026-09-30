import { test, expect } from "@playwright/test";

import { gotoTasks } from "../helpers";

test.describe("Vue calendrier", () => {
  test("la grille du mois s'affiche avec ses jours", async ({ page }) => {
    await gotoTasks(page);
    await page.getByRole("tab", { name: "Calendrier" }).click();

    const calendar = page.locator(".rbc-calendar");
    await expect(calendar).toBeVisible();

    const height = await calendar.evaluate((node) => node.getBoundingClientRect().height);
    expect(height).toBeGreaterThan(400);

    await expect(page.locator(".rbc-date-cell")).toHaveCount(35);
  });

  test("on navigue d'un mois à l'autre", async ({ page }) => {
    await gotoTasks(page);
    await page.getByRole("tab", { name: "Calendrier" }).click();

    const title = page.locator(".boardify-calendar p").first();
    const current = await title.innerText();

    await page.getByRole("button", { name: "Mois suivant" }).click();
    await expect(title).not.toHaveText(current);

    await page.getByRole("button", { name: "Aujourd'hui" }).click();
    await expect(title).toHaveText(current);
  });
});
