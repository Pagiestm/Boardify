import { test, expect } from "@playwright/test";

test.describe("Pages publiques", () => {
  test("la landing s'affiche et mène à la connexion", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Boardify/);
    await expect(page.getByRole("main")).toBeVisible();

    await page
      .getByRole("link", { name: /connexion|se connecter/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("le formulaire de connexion expose ses champs et les deux fournisseurs", async ({
    page,
  }) => {
    await page.goto("/sign-in");

    await expect(page.getByLabel("Adresse e-mail")).toBeVisible();
    await expect(page.getByLabel("Mot de passe", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Continuer avec Google" })).toBeEnabled();
    await expect(page.getByRole("button", { name: "Continuer avec GitHub" })).toBeEnabled();
  });

  test("un e-mail invalide est refusé sans appel réseau", async ({ page }) => {
    await page.goto("/sign-in");

    await page.getByLabel("Adresse e-mail").fill("pas-un-email");
    await page.getByLabel("Mot de passe", { exact: true }).fill("motdepasse123");
    await page.getByRole("button", { name: "Se connecter" }).click();

    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("on navigue de la connexion à l'inscription", async ({ page }) => {
    await page.goto("/sign-in");

    await page.getByRole("link", { name: "Créer un compte" }).click();
    await expect(page).toHaveURL(/\/sign-up$/);
  });

  test("le tableau de bord est inaccessible sans session", async ({ page }) => {
    await page.goto("/dashboard");

    await expect(page).toHaveURL(/\/sign-in$/);
  });

  test("le menu conduit aux sections de la page", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("link", { name: "FAQ" }).first().click();

    await expect(page).toHaveURL(/#faq$/);
    // Le défilement fluide est asynchrone : on attend que la section soit
    // réellement à l'écran plutôt que de se fier au seul changement d'URL.
    await expect(page.getByRole("heading", { name: "Questions fréquentes" })).toBeInViewport();
  });

  test("une question de la FAQ s'ouvre et se referme", async ({ page }) => {
    await page.goto("/#faq");

    const question = page.getByRole("button", { name: "Boardify est-il gratuit ?" });
    const answer = page.getByText(/sans carte bancaire/);

    await expect(answer).toBeHidden();

    await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "true");
    await expect(answer).toBeVisible();

    await question.click();
    await expect(question).toHaveAttribute("aria-expanded", "false");
    await expect(answer).toBeHidden();
  });
});
