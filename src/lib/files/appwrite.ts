import "server-only";

import { AppwriteException, ID, Permission, Role, type Storage } from "node-appwrite";

import { FileStore } from "./types";

const isNotFound = (error: unknown) => error instanceof AppwriteException && error.code === 404;

/**
 * Bucket Appwrite exposé avec l'interface neutre. Le Storage fourni doit être celui de la session :
 * la clé d'API n'a pas le droit d'écrire des fichiers.
 */
export const appwriteFileStore = (storage: Storage, bucketId: string): FileStore => ({
  upload: async (file, options = {}) => {
    const permissions = options.readableByUsers ? [Permission.read(Role.users())] : undefined;
    const stored = await storage.createFile(bucketId, options.id ?? ID.unique(), file, permissions);
    return { id: stored.$id };
  },
  read: async (id) => {
    try {
      const [file, data] = await Promise.all([
        storage.getFile(bucketId, id),
        storage.getFileView(bucketId, id),
      ]);
      return { data: new Uint8Array(data), mimeType: file.mimeType, name: file.name };
    } catch (error) {
      if (isNotFound(error)) return null;
      throw error;
    }
  },
  delete: async (id) => {
    await storage.deleteFile(bucketId, id);
  },
});
