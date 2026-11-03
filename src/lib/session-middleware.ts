import "server-only";

import { Databases, Storage } from "node-appwrite";

import { createHash } from "crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

import { AUTH_COOKIE } from "@/features/auth/constants";
import { requestClient } from "@/lib/appwrite";
import { getAuth, isAuthError, type AuthUser } from "@/lib/auth";
import type { AccountActions } from "@/lib/auth/types";
import { createDb, type Db } from "@/lib/db";
import { createFileStore, type FileStore } from "@/lib/files";

const SESSION_TTL = 60;

const sessionTag = (session: string) =>
  `session:${createHash("sha256").update(session).digest("hex")}`;

export const forgetSession = (session: string) => revalidateTag(sessionTag(session), { expire: 0 });

type AdditionalContext = {
  Variables: {
    /** Actions de l'utilisateur sur son compte (interface neutre, indépendante du service). */
    account: AccountActions;
    /** Stockage de fichiers (interface neutre, indépendante du service). */
    files: FileStore;
    user: AuthUser;
    /** Accès aux données (format neutre, indépendant de la base). */
    db: Db;
  };
};

export const sessionMiddleware = createMiddleware<AdditionalContext>(async (c, next) => {
  const session = getCookie(c, AUTH_COOKIE);

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const tag = sessionTag(session);
  let user: AuthUser;
  try {
    user = await unstable_cache(() => getAuth().getUser(session), ["session", tag], {
      revalidate: SESSION_TTL,
      tags: [tag],
    })();
  } catch (error) {
    if (isAuthError(error, "unauthorized")) return c.json({ error: "Unauthorized" }, 401);
    throw error;
  }

  // Appwrite (données et fichiers, s'ils y sont encore) : session ou clé d'API selon la connexion.
  const client = requestClient(session);

  c.set("account", getAuth().account(session, user));
  c.set("db", createDb(new Databases(client)));
  c.set("files", createFileStore(new Storage(client)));
  c.set("user", user);

  await next();
});
