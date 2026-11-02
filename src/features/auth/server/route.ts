import { Hono } from "hono";
import { Account, AppwriteException, Client, ID } from "node-appwrite";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";

import { createAdminClient } from "@/lib/appwrite";
import { forgetSession, sessionMiddleware } from "@/lib/session-middleware";

import { AUTH_COOKIE, isSecureUrl } from "../constants";
import { loginShema, recoverySchema, registerShema, resetPasswordSchema } from "../schemas";

/** Client sans session ni clé : la récupération de mot de passe se fait en visiteur. */
const guestAccount = () =>
  new Account(
    new Client()
      .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
      .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!),
  );

const app = new Hono()
  .get("/current", sessionMiddleware, (c) => {
    const user = c.get("user");

    return c.json({ data: user });
  })

  .post("/recovery", zValidator("json", recoverySchema), async (c) => {
    const { email } = c.req.valid("json");
    const origin = new URL(c.req.url).origin;

    // Même réponse que l'adresse existe ou non : on ne révèle pas qui a un compte.
    await guestAccount()
      .createRecovery(email, `${origin}/reset-password`)
      .catch((error) => {
        if (!(error instanceof AppwriteException) || error.code >= 500) throw error;
      });

    return c.json({ data: { success: true } });
  })
  .post("/recovery/confirm", zValidator("json", resetPasswordSchema), async (c) => {
    const { userId, secret, password } = c.req.valid("json");

    try {
      await guestAccount().updateRecovery(userId, secret, password);
    } catch (error) {
      const expired =
        error instanceof AppwriteException &&
        (error.type === "user_invalid_token" || error.code === 401 || error.code === 404);
      return c.json(
        {
          error: expired
            ? "Ce lien a expiré ou a déjà servi. Demandez-en un nouveau."
            : "Impossible de changer le mot de passe. Réessayez.",
        },
        400,
      );
    }

    return c.json({ data: { success: true } });
  })
  .post("/login", zValidator("json", loginShema), async (c) => {
    const { email, password } = c.req.valid("json");

    const { account } = await createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);

    setCookie(c, AUTH_COOKIE, session.secret, {
      path: "/",
      httpOnly: true,
      secure: isSecureUrl(c.req.url),
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30,
    });

    return c.json({ success: true });
  })

  .post("/register", zValidator("json", registerShema), async (c) => {
    const { name, email, password } = c.req.valid("json");

    const { account } = await createAdminClient();
    await account.create(ID.unique(), email, password, name);

    const session = await account.createEmailPasswordSession(email, password);

    setCookie(c, AUTH_COOKIE, session.secret, {
      path: "/",
      httpOnly: true,
      secure: isSecureUrl(c.req.url),
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 30,
    });

    return c.json({ success: true });
  })

  .post("/logout", sessionMiddleware, async (c) => {
    const account = c.get("account");
    const session = getCookie(c, AUTH_COOKIE);

    deleteCookie(c, AUTH_COOKIE);
    await account.deleteSession("current");

    if (session) forgetSession(session);

    return c.json({ success: true });
  });

export default app;
