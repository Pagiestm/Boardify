import { randomBytes } from "node:crypto";

/**
 * Identifiant de 20 caractères hexadécimaux, croissant dans le temps, au même format que ceux
 * d'Appwrite : les identifiants migrés et les nouveaux se trient ensemble.
 */
export const newId = () => {
  const now = Date.now();
  const seconds = Math.floor(now / 1000).toString(16);
  const micros = ((now % 1000) * 1000).toString(16).padStart(5, "0");
  return seconds + micros + randomBytes(4).toString("hex").slice(0, 7);
};
