import { z } from "zod";
import { Hono } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { zValidator } from "@hono/zod-validator";

import { AUTH_PROVIDER, getAuth, isAuthError } from "@/lib/auth";
import { createOneTimeToken, getBetterAuth } from "@/lib/auth/better-auth";
import { forgetSession, sessionMiddleware } from "@/lib/session-middleware";

import { AUTH_COOKIE, isSecureUrl } from "../constants";
import { loginShema, recoverySchema, registerShema, resetPasswordSchema } from "../schemas";

const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

const app = new Hono()
  .get("/current", sessionMiddleware, (c) => {
    const user = c.get("user");

    return c.json({ data: user });
  })

  .post("/recovery", zValidator("json", recoverySchema), async (c) => {
    const { email } = c.req.valid("json");
    const origin = new URL(c.req.url).origin;

    // Même réponse que l'adresse existe ou non : on ne révèle pas qui a un compte.
    await getAuth().requestRecovery(email, `${origin}/reset-password`);

    return c.json({ data: { success: true } });
  })
  .post("/recovery/confirm", zValidator("json", resetPasswordSchema), async (c) => {
    const { userId, secret, password } = c.req.valid("json");

    try {
      await getAuth().confirmRecovery(userId, secret, password);
    } catch (error) {
      return c.json(
        {
          error: isAuthError(error, "invalid_token")
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

    const token = await getAuth().signIn(email, password);

    setCookie(c, AUTH_COOKIE, token, {
      path: "/",
      httpOnly: true,
      secure: isSecureUrl(c.req.url),
      sameSite: "strict",
      maxAge: SESSION_MAX_AGE,
    });

    return c.json({ success: true });
  })

  .post("/register", zValidator("json", registerShema), async (c) => {
    const { name, email, password } = c.req.valid("json");

    const token = await getAuth().signUp({ name, email, password });

    setCookie(c, AUTH_COOKIE, token, {
      path: "/",
      httpOnly: true,
      secure: isSecureUrl(c.req.url),
      sameSite: "strict",
      maxAge: SESSION_MAX_AGE,
    });

    return c.json({ success: true });
  })

  .post("/logout", sessionMiddleware, async (c) => {
    const session = getCookie(c, AUTH_COOKIE);

    deleteCookie(c, AUTH_COOKIE);
    if (session) {
      await getAuth().signOut(session);
      forgetSession(session);
    }

    return c.json({ success: true });
  })

  /** Connexion Google ou GitHub : redirige vers le fournisseur. */
  .get(
    "/oauth/start",
    zValidator(
      "query",
      z.object({ provider: z.enum(["google", "github"]), desktop: z.enum(["0", "1"]).optional() }),
    ),
    async (c) => {
      const { provider, desktop } = c.req.valid("query");
      const origin = new URL(c.req.url).origin;
      const failure = `${origin}/sign-up`;
      try {
        const { url, cookies = [] } = await getAuth().startOAuth(provider, {
          success: `${origin}/oauth${desktop === "1" ? "/desktop" : ""}`,
          failure,
        });

        for (const cookie of cookies) c.header("Set-Cookie", cookie, { append: true });
        return c.redirect(url);
      } catch (error) {
        // Fournisseur non configuré ou indisponible : retour à l'inscription.
        console.error("[auth] connexion", provider, error);
        return c.redirect(failure);
      }
    },
  )

  /**
   * Retour de Google ou GitHub avec Better Auth : la session ouverte par Better Auth est remplacée
   * par un jeton à usage unique, échangé ensuite comme avec Appwrite (web et application desktop).
   */
  .get("/oauth/complete", zValidator("query", z.object({ success: z.string() })), async (c) => {
    const origin = new URL(c.req.url).origin;
    const success = new URL(c.req.valid("query").success, origin);
    if (AUTH_PROVIDER !== "better-auth" || success.origin !== origin) {
      return c.redirect(`${origin}/sign-up`);
    }

    const auth = getBetterAuth();
    const { headers, response } = await auth.api.getSession({
      headers: c.req.raw.headers,
      returnHeaders: true,
    });
    if (!response) return c.redirect(`${origin}/sign-up`);

    const secret = await createOneTimeToken(response.user.id);
    // La session du navigateur propre à Better Auth n'est plus utile.
    const signOut = await auth.api.signOut({ headers: c.req.raw.headers, returnHeaders: true });
    for (const cookie of [...headers.getSetCookie(), ...signOut.headers.getSetCookie()]) {
      c.header("Set-Cookie", cookie, { append: true });
    }

    success.searchParams.set("userId", response.user.id);
    success.searchParams.set("secret", secret);
    return c.redirect(success.toString());
  });

export default app;
