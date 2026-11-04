import "server-only";

import { createDb } from "@/lib/db";
import { createAdminClient } from "@/lib/appwrite";

import { intakeTokenSchema } from "../schemas";

/**
 * Formulaire actif correspondant au jeton, avec un accès aux données sans session (page
 * publique). Null pour un jeton mal formé, inconnu ou un formulaire désactivé.
 */
export const getPublicIntakeForm = async (token: string) => {
  if (!intakeTokenSchema.safeParse(token).success) return null;
  const { databases } = await createAdminClient();
  const db = createDb(databases);
  if (!db.intakeForms.enabled) return null;
  const form = await db.intakeForms.first({ where: { token } });
  return form && form.enabled !== false ? { db, form } : null;
};
