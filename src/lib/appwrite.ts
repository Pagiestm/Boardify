import "server-only";

import { Client, Account, Users, Databases, Storage } from "node-appwrite";

import { AUTH_PROVIDER } from "@/lib/auth/provider";

export async function createAdminClient() {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!)
    .setKey(process.env.NEXT_APPWRITE_KEY!);

  return {
    get account() {
      return new Account(client);
    },
    get users() {
      return new Users(client);
    },
    get databases() {
      return new Databases(client);
    },
    get storage() {
      return new Storage(client);
    },
  };
}

/**
 * Client Appwrite pour une requête : avec la session de l'utilisateur quand la connexion passe par
 * Appwrite, sinon (Better Auth) avec la clé d'API, qui doit alors avoir les droits sur les bases
 * de données et les fichiers.
 */
export const requestClient = (session: string) => {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);
  return AUTH_PROVIDER === "appwrite"
    ? client.setSession(session)
    : client.setKey(process.env.NEXT_APPWRITE_KEY!);
};

/** Accès Appwrite aux données pour une requête (voir `requestClient`). */
export const requestDatabases = (session: string) => new Databases(requestClient(session));
