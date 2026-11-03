import { defineConfig } from "drizzle-kit";

// Les commandes `npm run db:*` lisent DATABASE_URL dans .env.local.
try {
  process.loadEnvFile(".env.local");
} catch {
  // Sans .env.local, DATABASE_URL vient de l'environnement.
}

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/lib/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
