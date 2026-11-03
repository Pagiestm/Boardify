import "server-only";

import { Account, AppwriteException, Client, ID, Query, type Models } from "node-appwrite";

import { createAdminClient } from "@/lib/appwrite";

import { AuthError, type AuthErrorReason } from "./errors";
import type { AuthIdentity, AuthService, AuthUser } from "./types";

const client = () =>
  new Client()
    .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
    .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);

/** Compte vu avec la session de l'utilisateur. */
const sessionAccount = (token: string) => new Account(client().setSession(token));

/** Compte sans session ni clé : inscription et récupération de mot de passe se font en visiteur. */
const guestAccount = () => new Account(client());

const REASONS: Record<string, AuthErrorReason> = {
  user_invalid_credentials: "invalid_credentials",
  user_already_exists: "email_taken",
  user_email_already_exists: "email_taken",
  user_target_already_exists: "email_taken",
  user_password_recently_used: "password_recently_used",
  password_personal_data: "password_personal_data",
  user_invalid_token: "invalid_token",
  general_argument_invalid: "invalid_value",
  general_unauthorized_scope: "missing_scope",
};

/** Traduit les erreurs Appwrite connues ; les autres (réseau, 500…) sont relancées telles quelles. */
const translate = async <T>(action: Promise<T>): Promise<T> => {
  try {
    return await action;
  } catch (error) {
    if (error instanceof AppwriteException) {
      const reason = REASONS[error.type] ?? (error.code === 401 ? "unauthorized" : undefined);
      if (reason) throw new AuthError(reason, error.message, { cause: error });
    }
    throw error;
  }
};

const toUser = (user: Models.User<Models.Preferences>): AuthUser => ({
  $id: user.$id,
  name: user.name,
  email: user.email,
  prefs: { ...user.prefs },
  hasPassword: Boolean(user.passwordUpdate),
  createdAt: user.registration,
});

const toIdentity = (identity: Models.Identity): AuthIdentity => ({
  id: identity.$id,
  provider: identity.provider,
  providerUid: identity.providerUid,
  email: identity.providerEmail,
  createdAt: identity.$createdAt,
});

export const appwriteAuth = (): AuthService => ({
  signIn: async (email, password) => {
    const { account } = await createAdminClient();
    const session = await translate(account.createEmailPasswordSession(email, password));
    return session.secret;
  },
  signUp: async ({ name, email, password }) => {
    const { account } = await createAdminClient();
    await translate(account.create(ID.unique(), email, password, name));
    const session = await translate(account.createEmailPasswordSession(email, password));
    return session.secret;
  },
  getUser: async (token) => toUser(await translate(sessionAccount(token).get())),
  signOut: async (token) => {
    await translate(sessionAccount(token).deleteSession("current"));
  },

  startOAuth: async (provider, { success, failure }) => {
    const url = new URL(
      `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/account/tokens/oauth2/${provider}`,
    );
    url.searchParams.set("project", process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);
    url.searchParams.set("success", success);
    url.searchParams.set("failure", failure);
    return { url: url.toString() };
  },
  exchangeToken: async (userId, secret) => {
    const { account } = await createAdminClient();
    const session = await translate(account.createSession(userId, secret));
    return session.secret;
  },

  requestRecovery: async (email, resetUrl) => {
    await guestAccount()
      .createRecovery(email, resetUrl)
      .catch((error) => {
        // Adresse inconnue : même réponse, pour ne pas révéler qui a un compte.
        if (!(error instanceof AppwriteException) || error.code >= 500) throw error;
      });
  },
  confirmRecovery: async (userId, secret, password) => {
    try {
      await guestAccount().updateRecovery(userId, secret, password);
    } catch (error) {
      if (error instanceof AppwriteException && (error.code === 401 || error.code === 404)) {
        throw new AuthError("invalid_token", error.message, { cause: error });
      }
      await translate(Promise.reject(error));
    }
  },

  account: (token) => {
    const account = sessionAccount(token);
    return {
      updateName: async (name) => {
        await translate(account.updateName(name));
      },
      updateEmail: async (email, password) => {
        await translate(account.updateEmail(email, password));
      },
      updatePassword: async (password, oldPassword) => {
        await translate(account.updatePassword(password, oldPassword || undefined));
      },
      updatePrefs: async (prefs) => {
        await translate(account.updatePrefs(prefs));
      },
      listIdentities: async () => {
        const { identities } = await translate(account.listIdentities());
        return identities.map(toIdentity);
      },
      deleteIdentity: async (identityId) => {
        await translate(account.deleteIdentity(identityId));
      },
      block: async () => {
        await translate(account.updateStatus());
      },
    };
  },

  admin: {
    getUser: async (userId) => {
      const { users } = await createAdminClient();
      return toUser(await translate(users.get(userId)));
    },
    listIdentities: async (userId, provider) => {
      const { users } = await createAdminClient();
      const { identities } = await translate(
        users.listIdentities([
          Query.equal("userId", userId),
          ...(provider ? [Query.equal("provider", provider)] : []),
          Query.limit(25),
        ]),
      );
      return identities.map(toIdentity);
    },
    deleteUser: async (userId) => {
      const { users } = await createAdminClient();
      await translate(users.delete(userId));
    },
  },
});
