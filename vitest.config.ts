import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Même fuseau partout (en local comme dans la CI) pour les calculs par jour.
process.env.TZ = "Europe/Paris";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      // Hors de Next, « server-only » refuse de se charger : les tests le remplacent par un module vide.
      "server-only": fileURLToPath(new URL("./src/test/server-only.ts", import.meta.url)),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    env: {
      AI_ENCRYPTION_KEY: Buffer.alloc(32, 7).toString("base64"),
    },
  },
});
