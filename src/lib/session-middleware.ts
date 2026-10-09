import "server-only";

import {
  Account,
  Client,
  Databases,
  Models,
  Storage,
  type Account as AccountType,
  type Databases as DatabasesType,
  type Storage as StorageType,
  type Users as UsersType,
} from "node-appwrite";

import { createHash } from "crypto";
import { unstable_cache, revalidateTag } from "next/cache";
import { getCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";

import { AUTH_COOKIE } from "@/features/auth/constants";

const SESSION_TTL = 60;

const sessionTag = (session: string) =>
  `session:${createHash("sha256").update(session).digest("hex")}`;

export const forgetSession = (session: string) => revalidateTag(sessionTag(session), { expire: 0 });

type AdditionalContext = {
  Variables: {
    account: AccountType;
    databases: DatabasesType;
    storage: StorageType;
    users: UsersType;
    user: Models.User<Models.Preferences>;
  };
};

export const sessionMiddleware = createMiddleware<AdditionalContext>(async (c, next) => {
  const client = new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

  const session = getCookie(c, AUTH_COOKIE);

  if (!session) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  client.setSession(session);

  const account = new Account(client);
  const databases = new Databases(client);
  const storage = new Storage(client);

  const tag = sessionTag(session);
  const user = await unstable_cache(() => account.get(), ["session", tag], {
    revalidate: SESSION_TTL,
    tags: [tag],
  })();

  c.set("account", account);
  c.set("databases", databases);
  c.set("storage", storage);
  c.set("user", user);

  await next();
});
