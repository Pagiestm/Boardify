import { test, expect } from "@playwright/test";

test.describe("Référencement", () => {
  test("chaque page publique porte son propre titre", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/^Boardify - Gestion de projets/);

    await page.goto("/sign-in");
    await expect(page).toHaveTitle("Connexion · Boardify");

    await page.goto("/sign-up");
    await expect(page).toHaveTitle("Créer un compte · Boardify");
  });

  test("la landing expose ses métadonnées de partage", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      "content",
      /Boardify réunit/,
    );
    await expect(page.locator('meta[property="og:title"]')).toHaveCount(1);
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute(
      "content",
      "Boardify",
    );
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
  });

  test("robots.txt et sitemap.xml sont servis", async ({ request }) => {
    const robots = await request.get("/robots.txt");
    expect(robots.status()).toBe(200);
    const body = await robots.text();
    expect(body).toContain("Sitemap:");
    expect(body).toContain("Disallow: /api/");

    const sitemap = await request.get("/sitemap.xml");
    expect(sitemap.status()).toBe(200);
    expect(await sitemap.text()).toContain("/sign-up");
  });

  test("les pages privées ne sont pas indexables", async ({ page }) => {
    await page.goto("/sign-in");
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });
});
