import { readFileSync } from "node:fs";

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

export default nextConfig;
