import "server-only";

import { randomBytes } from "node:crypto";

import { betterAuth, APIError } from "better-auth";
import { verifyPassword } from "better-auth/crypto";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { verify as verifyArgon2 } from "@node-rs/argon2";

import { sendEmail } from "@/lib/email";
import { resetPasswordEmail } from "@/lib/email/templates/reset-password";
import { NotFoundError } from "@/lib/db/errors";
import { getPostgres } from "@/lib/db/client";
import { newId } from "@/lib/id";
import { authAccounts, authSessions, authUsers, authVerifications } from "@/lib/db/schema";

import { AuthError } from "./errors";
import type { AuthIdentity, AuthService, AuthUser } from "./types";

/** Préfixe des routes gérées par Better Auth (retours Google et GitHub). */
export const BETTER_AUTH_PATH = "/api/better-auth";

const SESSION_DAYS = 30;
const ONE_TIME_TOKEN_MS = 5 * 60 * 1000;
const RESET_TOKEN_MS = 60 * 60 * 1000;
const CREDENTIAL = "credential";

const socialProvider = (id: string, secret: string) => {
  const clientId = process.env[id];
  const clientSecret = process.env[secret];
  return clientId && clientSecret ? { clientId, clientSecret } : undefined;
};

const createBetterAuth = () =>
  betterAuth({
    appName: "Boardify",
    baseURL: process.env.NEXT_PUBLIC_APP_URL,
    basePath: BETTER_AUTH_PATH,
    secret: process.env.BETTER_AUTH_SECRET,
    database: drizzleAdapter(getPostgres(), {
      provider: "pg",
      schema: {
        user: authUsers,
        session: authSessions,
        account: authAccounts,
        verification: authVerifications,
      },
    }),
    emailAndPassword: {
      enabled: true,
      autoSignIn: true,
      password: {
        // Les comptes importés d'Appwrite gardent leur mot de passe, haché avec Argon2.
        verify: ({ hash, password }) =>
          hash.startsWith("$argon2")
            ? verifyArgon2(hash, password)
            : verifyPassword({ hash, password }),
      },
    },
    socialProviders: {
      google: socialProvider("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"),
      github: socialProvider("GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"),
    },
    // Même comportement qu'Appwrite : Google ou GitHub rejoint le compte qui a la même adresse.
    account: { accountLinking: { enabled: true, trustedProviders: ["google", "github"] } },
    user: { additionalFields: { prefs: { type: "string", required: false, input: false } } },
    session: { expiresIn: SESSION_DAYS * 24 * 60 * 60 },
    advanced: { database: { generateId: () => newId() } },
  });

type BetterAuth = ReturnType<typeof createBetterAuth>;

const globalForAuth = globalThis as typeof globalThis & { boardifyBetterAuth?: BetterAuth };

/** Instance Better Auth, créée à la première utilisation. */
export const getBetterAuth = () => (globalForAuth.boardifyBetterAuth ??= createBetterAuth());

const context = () => getBetterAuth().$context;

type StoredUser = {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
  prefs?: string | null;
};

const parsePrefs = (prefs: string | null | undefined): Record<string, unknown> => {
  try {
    const parsed = prefs ? JSON.parse(prefs) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
};

const credentialOf = async (userId: string) =>
  (await (await context()).internalAdapter.findCredentialAccount(userId)) as {
    id: string;
    password?: string | null;
  } | null;

const toUser = async (user: StoredUser): Promise<AuthUser> => ({
  $id: user.id,
  name: user.name,
  email: user.email,
  prefs: parsePrefs(user.prefs),
  hasPassword: Boolean((await credentialOf(user.id))?.password),
  createdAt: new Date(user.createdAt).toISOString(),
});

const findUser = async (userId: string) => {
  const user = (await (await context()).internalAdapter.findUserById(userId)) as StoredUser | null;
  if (!user) throw new NotFoundError("Utilisateur introuvable");
  return user;
};

const identitiesOf = async (user: StoredUser): Promise<AuthIdentity[]> => {
  const accounts = (await (await context()).internalAdapter.findAccounts(user.id)) as {
    id: string;
    providerId: string;
    accountId: string;
    createdAt: Date;
  }[];
  return accounts
    .filter((account) => account.providerId !== CREDENTIAL)
    .map((account) => ({
      id: account.id,
      provider: account.providerId,
      providerUid: account.accountId,
      // Better Auth ne garde pas l'adresse du compte Google ou GitHub : celle du compte Boardify.
      email: user.email,
      createdAt: new Date(account.createdAt).toISOString(),
    }));
};

/** Jeton aléatoire stocké dans la table des vérifications, consommé une seule fois. */
const createToken = async (kind: string, userId: string, lifetime: number) => {
  const secret = randomBytes(32).toString("hex");
  await (
    await context()
  ).internalAdapter.createVerificationValue({
    identifier: `${kind}:${secret}`,
    value: userId,
    expiresAt: new Date(Date.now() + lifetime),
  });
  return secret;
};

const consumeToken = async (kind: string, userId: string, secret: string) => {
  const stored = (await (
    await context()
  ).internalAdapter.consumeVerificationValue(`${kind}:${secret}`)) as {
    value: string;
    expiresAt: Date;
  } | null;
  if (!stored || stored.value !== userId || new Date(stored.expiresAt).getTime() < Date.now()) {
    throw new AuthError("invalid_token", "Lien expiré ou déjà utilisé");
  }
};

/** Définit (ou remplace) le mot de passe d'un compte. */
const setPassword = async (userId: string, password: string) => {
  const ctx = await context();
  const { minPasswordLength, maxPasswordLength } = ctx.password.config;
  if (password.length < minPasswordLength || password.length > maxPasswordLength) {
    throw new AuthError("invalid_value", "Longueur de mot de passe invalide");
  }
  const hash = await ctx.password.hash(password);
  if (await credentialOf(userId)) {
    await ctx.internalAdapter.updatePassword(userId, hash);
  } else {
    await ctx.internalAdapter.createAccount({
      userId,
      providerId: CREDENTIAL,
      accountId: userId,
      password: hash,
    });
  }
};

const checkPassword = async (userId: string, password: string) => {
  const hash = (await credentialOf(userId))?.password;
  const ctx = await context();
  if (!hash || !(await ctx.password.verify({ hash, password }))) {
    throw new AuthError("invalid_credentials", "Mot de passe incorrect");
  }
};

/** Erreurs de l'API Better Auth traduites dans les raisons communes. */
const translate = (error: unknown): never => {
  if (error instanceof APIError) {
    const code = String((error.body as { code?: string } | undefined)?.code ?? "");
    if (code.includes("INVALID_EMAIL_OR_PASSWORD")) throw new AuthError("invalid_credentials");
    if (code.includes("USER_ALREADY_EXISTS")) throw new AuthError("email_taken");
    if (code.includes("PASSWORD") || error.statusCode === 400) {
      throw new AuthError("invalid_value", error.message, { cause: error });
    }
    if (error.statusCode === 401) throw new AuthError("unauthorized", error.message);
  }
  throw error;
};

export const betterAuthService = (): AuthService => ({
  signIn: async (email, password) => {
    const result = await getBetterAuth()
      .api.signInEmail({ body: { email, password } })
      .catch(translate);
    return result.token;
  },
  signUp: async ({ name, email, password }) => {
    const result = await getBetterAuth()
      .api.signUpEmail({ body: { name, email, password } })
      .catch(translate);
    if (!result.token) throw new AuthError("unknown", "Session non créée");
    return result.token;
  },
  getUser: async (token) => {
    const found = (await (await context()).internalAdapter.findSession(token)) as {
      session: { expiresAt: Date };
      user: StoredUser;
    } | null;
    if (!found || new Date(found.session.expiresAt).getTime() < Date.now()) {
      throw new AuthError("unauthorized", "Session expirée");
    }
    return toUser(found.user);
  },
  signOut: async (token) => {
    await (await context()).internalAdapter.deleteSession(token);
  },

  startOAuth: async (provider, { success, failure }) => {
    // Retour de Google ou GitHub → /api/auth/oauth/complete, qui transmet un jeton à `success`.
    const origin = new URL(success).origin;
    const complete = new URL("/api/auth/oauth/complete", origin);
    complete.searchParams.set("success", success);

    const { headers, response } = await getBetterAuth()
      .api.signInSocial({
        body: {
          provider,
          callbackURL: complete.toString(),
          errorCallbackURL: failure,
          disableRedirect: true,
        },
        returnHeaders: true,
      })
      .catch(translate);
    if (!response.url) throw new AuthError("unknown", `Fournisseur ${provider} non configuré`);
    return { url: response.url, cookies: headers.getSetCookie() };
  },
  exchangeToken: async (userId, secret) => {
    await consumeToken("one-time", userId, secret);
    await findUser(userId);
    const session = await (await context()).internalAdapter.createSession(userId);
    return session.token;
  },

  requestRecovery: async (email, resetUrl) => {
    const user = (await (
      await context()
    ).internalAdapter.findUserByEmail(email.trim().toLowerCase())) as { user: StoredUser } | null;
    // Adresse inconnue : même réponse, pour ne pas révéler qui a un compte.
    if (!user) return;

    const secret = await createToken("reset-password", user.user.id, RESET_TOKEN_MS);
    const url = new URL(resetUrl);
    url.searchParams.set("userId", user.user.id);
    url.searchParams.set("secret", secret);
    await sendEmail(
      resetPasswordEmail({ to: user.user.email, name: user.user.name, url: url.toString() }),
    );
  },
  confirmRecovery: async (userId, secret, password) => {
    await consumeToken("reset-password", userId, secret);
    await setPassword(userId, password);
    // Toutes les sessions ouvertes avec l'ancien mot de passe sont fermées.
    await (await context()).internalAdapter.deleteUserSessions(userId);
  },

  account: (_token, user) => ({
    updateName: async (name) => {
      await (await context()).internalAdapter.updateUser(user.$id, { name });
    },
    updateEmail: async (email, password) => {
      await checkPassword(user.$id, password);
      const ctx = await context();
      const normalized = email.trim().toLowerCase();
      const existing = (await ctx.internalAdapter.findUserByEmail(normalized)) as {
        user: StoredUser;
      } | null;
      if (existing && existing.user.id !== user.$id) throw new AuthError("email_taken");
      await ctx.internalAdapter.updateUser(user.$id, { email: normalized, emailVerified: false });
    },
    updatePassword: async (password, oldPassword) => {
      if ((await credentialOf(user.$id))?.password) {
        await checkPassword(user.$id, oldPassword ?? "");
      }
      await setPassword(user.$id, password);
    },
    updatePrefs: async (prefs) => {
      await (
        await context()
      ).internalAdapter.updateUser(user.$id, {
        prefs: JSON.stringify(prefs),
      });
    },
    listIdentities: async () => identitiesOf(await findUser(user.$id)),
    deleteIdentity: async (identityId) => {
      const identities = await identitiesOf(await findUser(user.$id));
      if (!identities.some((identity) => identity.id === identityId)) {
        throw new NotFoundError("Compte relié introuvable");
      }
      await (await context()).internalAdapter.deleteAccount(identityId);
    },
    // Avec Better Auth, la suppression du compte est toujours possible : bloquer revient à supprimer.
    block: async () => {
      await (await context()).internalAdapter.deleteUser(user.$id);
    },
  }),

  admin: {
    getUser: async (userId) => toUser(await findUser(userId)),
    listIdentities: async (userId, provider) => {
      const identities = await identitiesOf(await findUser(userId));
      return provider
        ? identities.filter((identity) => identity.provider === provider)
        : identities;
    },
    deleteUser: async (userId) => {
      await (await context()).internalAdapter.deleteUser(userId);
    },
  },
});

/** Jeton à usage unique pour l'utilisateur d'une session Better Auth (retour OAuth). */
export const createOneTimeToken = (userId: string) =>
  createToken("one-time", userId, ONE_TIME_TOKEN_MS);
