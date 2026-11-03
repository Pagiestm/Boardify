import "server-only";

import type { Storage } from "node-appwrite";

import { IMAGES_BUCKET_ID } from "@/config";

import { appwriteFileStore } from "./appwrite";
import { s3ConfigFromEnv, s3FileStore } from "./s3";

export type { FileStore, StoredFile, UploadOptions } from "./types";

/** Service de stockage : Appwrite tant que `STORAGE_PROVIDER=s3` n'est pas défini. */
export const storageProvider = () => (process.env.STORAGE_PROVIDER === "s3" ? "s3" : "appwrite");

let s3Config: ReturnType<typeof s3ConfigFromEnv> | undefined;

/**
 * Stockage de fichiers. Avec Appwrite, les fichiers passent par le Storage de la session ;
 * avec S3, il est ignoré et le client est créé au premier usage.
 */
export const createFileStore = (storage: Storage) =>
  storageProvider() === "s3"
    ? s3FileStore(() => (s3Config ??= s3ConfigFromEnv()))
    : appwriteFileStore(storage, IMAGES_BUCKET_ID);

/** Image envoyée dans un formulaire, sous forme d'adresse `data:` enregistrée avec l'élément. */
export const imageDataUrl = async (image: File) => {
  const type = image.type.startsWith("image/") ? image.type : "image/png";
  return `data:${type};base64,${Buffer.from(await image.arrayBuffer()).toString("base64")}`;
};
