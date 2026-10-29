import "server-only";

import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

const VERSION = "v1";
const IV_LENGTH = 12;
const TAG_LENGTH = 16;

const getKey = () => {
  const key = Buffer.from(process.env.AI_ENCRYPTION_KEY ?? "", "base64");
  if (key.length !== 32) {
    throw new Error("AI_ENCRYPTION_KEY doit contenir 32 octets encodés en base64");
  }
  return key;
};

/** Chiffre une clé d'API (AES-256-GCM) : « v1:<iv|tag|texte chiffré en base64> ». */
export const encryptSecret = (plain: string) => {
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return `${VERSION}:${Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString("base64")}`;
};

export const decryptSecret = (value: string) => {
  const [version, payload] = value.split(":");
  if (version !== VERSION || !payload) throw new Error("Format de clé chiffrée inconnu");

  const data = Buffer.from(payload, "base64");
  const iv = data.subarray(0, IV_LENGTH);
  const tag = data.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH);
  const decipher = createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([
    decipher.update(data.subarray(IV_LENGTH + TAG_LENGTH)),
    decipher.final(),
  ]).toString("utf8");
};
