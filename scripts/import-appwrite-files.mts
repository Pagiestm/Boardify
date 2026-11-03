/**
 * Copie les fichiers du bucket Appwrite vers le stockage S3, en gardant les identifiants : les
 * pièces jointes et photos de profil restent liées à leur fichier. Peut être relancé : les
 * fichiers déjà présents dans S3 sont ignorés.
 *
 *   npm run files:import-appwrite              copie tout
 *   npm run files:import-appwrite -- --dry-run compte sans rien écrire
 *
 * Lit .env.local : variables Appwrite (clé d'API avec le droit files.read) et S3_*.
 */
import { HeadObjectCommand, S3ServiceException } from "@aws-sdk/client-s3";
import { AppwriteException, Client, Query, Storage, type Models } from "node-appwrite";

import { s3ConfigFromEnv, s3FileStore } from "../src/lib/files/s3.ts";

const dryRun = process.argv.includes("--dry-run");
const PAGE = 100;

const bucketId = process.env.NEXT_PUBLIC_APPWRITE_IMAGES_BUCKET_ID!;
const storage = new Storage(
  new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setKey(process.env.NEXT_APPWRITE_KEY!),
);

const s3 = dryRun ? null : s3ConfigFromEnv();
const store = s3 ? s3FileStore(() => s3) : null;

/** Tous les fichiers du bucket, page par page. */
async function* filesOf() {
  let cursor: string | undefined;
  do {
    const queries = [Query.limit(PAGE), ...(cursor ? [Query.cursorAfter(cursor)] : [])];
    const { files } = await storage.listFiles(bucketId, queries);
    yield files;
    cursor = files.length === PAGE ? files[PAGE - 1].$id : undefined;
  } while (cursor);
}

const existsInS3 = async (id: string) => {
  try {
    await s3!.client.send(new HeadObjectCommand({ Bucket: s3!.bucket, Key: id }));
    return true;
  } catch (error) {
    if (error instanceof S3ServiceException && error.$metadata.httpStatusCode === 404) {
      return false;
    }
    throw error;
  }
};

const copy = async (file: Models.File) => {
  if (await existsInS3(file.$id)) return "skipped";
  const data = await storage.getFileDownload(bucketId, file.$id);
  await store!.upload(new File([data], file.name, { type: file.mimeType }), { id: file.$id });
  return "copied";
};

try {
  let total = 0;
  let size = 0;
  let copied = 0;
  let skipped = 0;

  for await (const files of filesOf()) {
    for (const file of files) {
      total += 1;
      size += file.sizeOriginal;
      if (dryRun) continue;
      if ((await copy(file)) === "copied") copied += 1;
      else skipped += 1;
    }
  }

  const megabytes = (size / 1024 / 1024).toFixed(1);
  console.log(`- ${total} fichier${total > 1 ? "s" : ""} dans Appwrite (${megabytes} Mo)`);
  if (dryRun) {
    console.log("\nSimulation : rien n'a été écrit.");
  } else {
    console.log(
      `- ${copied} copié${copied > 1 ? "s" : ""}, ${skipped} déjà présent${skipped > 1 ? "s" : ""}`,
    );
    console.log("\nImport terminé.");
  }
} catch (error) {
  if (
    error instanceof AppwriteException &&
    (error.type === "general_unauthorized_scope" || error.code === 401)
  ) {
    console.error(
      "La clé d'API Appwrite n'a pas le droit de lire les fichiers : ajoutez les scopes " +
        "files.read (et buckets.read) à NEXT_APPWRITE_KEY dans la console Appwrite, puis relancez.",
    );
    process.exit(1);
  }
  throw error;
}
