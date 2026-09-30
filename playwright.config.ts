import { loadEnvConfig } from "@next/env";
import { defineConfig, devices } from "@playwright/test";

loadEnvConfig(process.cwd());

const baseURL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

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
            name: "cleanup",
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
