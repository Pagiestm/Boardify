import { readFileSync } from "node:fs";
import { withSentryConfig } from "@sentry/nextjs/config";

const { version } = JSON.parse(readFileSync(new URL("./package.json", import.meta.url), "utf8"));

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ne pas générer AGENTS.md / CLAUDE.md au lancement de `next dev`
  agentRules: false,
  env: {
    // Version mise à jour par semantic-release dans package.json
    NEXT_PUBLIC_APP_VERSION: version,
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  telemetry: false,
  // Envoi des sources pour lire les erreurs en clair : seulement si un jeton Sentry est fourni.
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  sourcemaps: { disable: !process.env.SENTRY_AUTH_TOKEN },
  widenClientFileUpload: true,
  // Passe par le site pour ne pas être bloqué par les bloqueurs de publicité.
  tunnelRoute: "/monitoring",
});
