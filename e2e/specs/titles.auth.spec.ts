import { test, expect } from "@playwright/test";

import { gotoWorkspace, workspaceIdFromUrl } from "../helpers";

test.describe("Titres des pages privées", () => {
  test("chaque route porte son propre titre", async ({ page }) => {
    await gotoWorkspace(page);
    const workspaceId = workspaceIdFromUrl(page);

    const routes: [string, string][] = [
      ["", "Tableau de bord · Boardify"],
      ["/tasks", "Mes tâches · Boardify"],
      ["/members", "Membres · Boardify"],
      ["/settings", "Paramètres de l'espace · Boardify"],
    ];

    for (const [route, title] of routes) {
      await page.goto(`/workspaces/${workspaceId}${route}`, { waitUntil: "domcontentloaded" });
      await expect(page).toHaveTitle(title);
    }
  });
});
