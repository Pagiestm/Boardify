import { test, expect } from "@playwright/test";

import { gotoWorkspace } from "../helpers";

test.describe("Résilience réseau", () => {
  test("une erreur de l'API s'affiche sans marteler le serveur", async ({ page }) => {
    await gotoWorkspace(page);

    let attempts = 0;
    await page.route("**/api/tasks?*", (route) => {
      attempts += 1;
      return route.fulfill({
        status: 429,
        contentType: "application/json",
        body: JSON.stringify({ error: "Rate limit" }),
      });
    });

    await page.reload();

    await expect(page.getByText("Impossible de charger l'espace de travail")).toBeVisible({
      timeout: 20_000,
    });
    expect(attempts).toBeLessThanOrEqual(2);
  });

  test("une réponse 4xx n'est pas réessayée", async ({ page }) => {
    await gotoWorkspace(page);

    let attempts = 0;
    await page.route("**/api/projects?*", (route) => {
      attempts += 1;
      return route.fulfill({
        status: 403,
        contentType: "application/json",
        body: JSON.stringify({ error: "Unauthorized" }),
      });
    });

    await page.reload();

    await expect(page.getByText("Impossible de charger l'espace de travail")).toBeVisible({
      timeout: 20_000,
    });
    expect(attempts).toBe(1);
  });
});
