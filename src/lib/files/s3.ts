/**
 * Stockage compatible S3 (Cloudflare R2, Scaleway, AWS, MinIO…). Sans « server-only » ni alias
 * d'import : le script d'import depuis Appwrite l'utilise aussi.
 */
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
  S3ServiceException,
} from "@aws-sdk/client-s3";

import { newId } from "../id.ts";
import type { FileStore } from "./types.ts";

type Client = Pick<S3Client, "send">;

/** Le nom d'origine est gardé dans les métadonnées, qui n'acceptent que de l'ASCII. */
export const encodeName = (name: string) => encodeURIComponent(name);
export const decodeName = (value: string | undefined) => {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

const isNotFound = (error: unknown) =>
  error instanceof S3ServiceException &&
  (error.name === "NoSuchKey" || error.$metadata.httpStatusCode === 404);

/** Client et bucket lus dans l'environnement (variables S3_*). */
export const s3ConfigFromEnv = () => {
  const bucket = process.env.S3_BUCKET;
  const accessKeyId = process.env.S3_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
  if (!bucket || !accessKeyId || !secretAccessKey) {
    throw new Error(
      "Stockage S3 non configuré (S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY)",
    );
  }
  const endpoint = process.env.S3_ENDPOINT || undefined;
  const client = new S3Client({
    endpoint,
    region: process.env.S3_REGION || "auto",
    credentials: { accessKeyId, secretAccessKey },
    // Les services autres qu'AWS (MinIO notamment) attendent le bucket dans le chemin.
    forcePathStyle: Boolean(endpoint),
  });
  return { client, bucket };
};

/** Bucket S3 exposé avec l'interface neutre ; la clé de chaque fichier est son identifiant. */
export const s3FileStore = (config: () => { client: Client; bucket: string }): FileStore => ({
  upload: async (file, options = {}) => {
    const { client, bucket } = config();
    const id = options.id ?? newId();
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: id,
        Body: new Uint8Array(await file.arrayBuffer()),
        ContentType: file.type || "application/octet-stream",
        Metadata: file.name ? { name: encodeName(file.name) } : undefined,
      }),
    );
    return { id };
  },
  read: async (id) => {
    const { client, bucket } = config();
    try {
      const object = await client.send(new GetObjectCommand({ Bucket: bucket, Key: id }));
      if (!object.Body) return null;
      return {
        data: new Uint8Array(await object.Body.transformToByteArray()),
        mimeType: object.ContentType || "application/octet-stream",
        name: decodeName(object.Metadata?.name),
      };
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  },
  delete: async (id) => {
    const { client, bucket } = config();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: id }));
  },
});
