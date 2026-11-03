import { afterEach, describe, expect, it, vi } from "vitest";
import { AppwriteException, type Storage } from "node-appwrite";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  NoSuchKey,
  PutObjectCommand,
} from "@aws-sdk/client-s3";

import { appwriteFileStore } from "./appwrite";
import { createFileStore, imageDataUrl, storageProvider } from "./index";
import { decodeName, encodeName, s3FileStore } from "./s3";

afterEach(() => vi.unstubAllEnvs());

describe("choix du stockage", () => {
  it("reste sur Appwrite par défaut", () => {
    vi.stubEnv("STORAGE_PROVIDER", "");
    expect(storageProvider()).toBe("appwrite");
  });

  it("passe sur S3 avec STORAGE_PROVIDER=s3, sans exiger la configuration à la création", () => {
    vi.stubEnv("STORAGE_PROVIDER", "s3");
    vi.stubEnv("S3_BUCKET", "");
    expect(storageProvider()).toBe("s3");
    expect(() => createFileStore({} as Storage)).not.toThrow();
  });
});

describe("Appwrite", () => {
  it("rend la photo de profil lisible par les utilisateurs connectés", async () => {
    const createFile = vi.fn().mockResolvedValue({ $id: "f1" });
    const store = appwriteFileStore({ createFile } as unknown as Storage, "bucket");

    await expect(
      store.upload(new File(["x"], "a.png"), { readableByUsers: true }),
    ).resolves.toEqual({ id: "f1" });
    expect(createFile.mock.calls[0][3]).toEqual(['read("users")']);

    await store.upload(new File(["x"], "b.pdf"), { id: "fixe" });
    expect(createFile.mock.calls[1][1]).toBe("fixe");
    expect(createFile.mock.calls[1][3]).toBeUndefined();
  });

  it("renvoie null pour un fichier introuvable", async () => {
    const missing = new AppwriteException("introuvable", 404);
    const store = appwriteFileStore(
      {
        getFile: vi.fn().mockRejectedValue(missing),
        getFileView: vi.fn().mockRejectedValue(missing),
      } as unknown as Storage,
      "bucket",
    );
    await expect(store.read("x")).resolves.toBeNull();
  });
});

describe("S3", () => {
  it("garde les noms accentués dans les métadonnées", () => {
    const encoded = encodeName("Compte rendu été.pdf");
    expect(encoded).toMatch(/^[\x20-\x7e]+$/);
    expect(decodeName(encoded)).toBe("Compte rendu été.pdf");
    expect(decodeName(undefined)).toBeUndefined();
  });

  it("envoie, relit et supprime avec l'identifiant comme clé", async () => {
    const send = vi.fn();
    const store = s3FileStore(() => ({ client: { send }, bucket: "boardify" }));

    send.mockResolvedValueOnce({});
    const { id } = await store.upload(new File(["bonjour"], "note é.txt", { type: "text/plain" }));
    expect(id).toMatch(/^[0-9a-f]{20}$/);
    const put = send.mock.calls[0][0] as PutObjectCommand;
    expect(put).toBeInstanceOf(PutObjectCommand);
    expect(put.input).toMatchObject({
      Bucket: "boardify",
      Key: id,
      ContentType: "text/plain",
      Metadata: { name: encodeName("note é.txt") },
    });

    send.mockResolvedValueOnce({
      Body: { transformToByteArray: async () => new TextEncoder().encode("bonjour") },
      ContentType: "text/plain",
      Metadata: { name: encodeName("note é.txt") },
    });
    const file = await store.read(id);
    expect(send.mock.calls[1][0]).toBeInstanceOf(GetObjectCommand);
    expect(new TextDecoder().decode(file!.data)).toBe("bonjour");
    expect(file).toMatchObject({ mimeType: "text/plain", name: "note é.txt" });

    send.mockResolvedValueOnce({});
    await store.delete(id);
    expect(send.mock.calls[2][0]).toBeInstanceOf(DeleteObjectCommand);
  });

  it("renvoie null pour un fichier introuvable", async () => {
    const send = vi
      .fn()
      .mockRejectedValue(new NoSuchKey({ message: "introuvable", $metadata: {} }));
    const store = s3FileStore(() => ({ client: { send }, bucket: "boardify" }));
    await expect(store.read("absent")).resolves.toBeNull();
  });
});

describe("imageDataUrl", () => {
  it("garde le type de l'image", async () => {
    const url = await imageDataUrl(
      new File([new Uint8Array([1, 2])], "a.webp", { type: "image/webp" }),
    );
    expect(url).toBe("data:image/webp;base64,AQI=");
  });
});
