import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

// Playwright ne lit pas les .env de Next : on les charge explicitement pour
// disposer des identifiants du compte de test en local.
loadEnvConfig(process.cwd());

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

/**
 * Les parcours authentifiés ont besoin d'un compte Appwrite réel : sans
 * identifiants, seul le projet « public » est monté (voir e2e/README.md).
 */
export const hasCredentials = Boolean(process.env.E2E_EMAIL && process.env.E2E_PASSWORD);

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : [["list"]],
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "public",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /specs\/.*\.public\.spec\.ts/,
    },
    ...(hasCredentials
      ? [
          {
            name: "setup",
            use: { ...devices["Desktop Chrome"] },
            testMatch: /setup\/auth\.setup\.ts/,
            teardown: "cleanup",
          },
          {
            name: "authenticated",
            use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
            testMatch: /specs\/.*\.auth\.spec\.ts/,
            dependencies: ["setup"],
          },
          {
            // Joué une fois la suite terminée : supprime ce que les tests ont créé.
            name: "cleanup",
            // Réutilise la session du compte de test : le nettoyage passe par
            // l'API de l'application, pas par une clé Appwrite privilégiée.
            use: { ...devices["Desktop Chrome"], storageState: "e2e/.auth/user.json" },
            testMatch: /setup\/cleanup\.teardown\.ts/,
          },
        ]
      : []),
  ],
  webServer: {
    command: process.env.CI ? "npm run start" : "npm run dev",
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
