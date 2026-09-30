import path from "node:path";

import { test as setup, expect } from "@playwright/test";

import { WORKSPACE_NAME } from "../helpers/data";

const storageState = path.join(__dirname, "../.auth/user.json");

/**
 * Se connecte une fois pour toutes et conserve le cookie de session : les
 * specs authentifiées repartent de cet état au lieu de rejouer le formulaire.
 *
 * Le compte de test est vierge après chaque nettoyage — /dashboard renvoie
 * alors vers la création d'un espace de travail, qu'on crée ici.
 */
setup("authentification", async ({ page }) => {
  await page.goto("/sign-in");

  await page.getByLabel("Adresse e-mail").fill(process.env.E2E_EMAIL!);
  await page.getByLabel("Mot de passe", { exact: true }).fill(process.env.E2E_PASSWORD!);
  await page.getByRole("button", { name: "Se connecter" }).click();

  await page.waitForURL(/\/workspaces\//, { timeout: 30_000 });

  if (new URL(page.url()).pathname === "/workspaces/create") {
    await page.getByLabel("Nom de l'espace de travail").fill(WORKSPACE_NAME);
    await page.getByRole("button", { name: "Créer", exact: true }).click();
    await page.waitForURL(/\/workspaces\/(?!create)[^/]+$/, { timeout: 30_000 });
  }

  await expect(page.getByRole("link", { name: "Mes tâches" })).toBeVisible();

  await page.context().storageState({ path: storageState });
});
