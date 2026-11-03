import "server-only";

import { appwriteAuth } from "./appwrite";
import { betterAuthService } from "./better-auth";
import { AUTH_PROVIDER } from "./provider";
import type { AuthService } from "./types";

export type { AuthUser, AuthIdentity, AuthService, OAuthProviderName } from "./types";
export { AuthError, isAuthError } from "./errors";
export { AUTH_PROVIDER } from "./provider";

let service: AuthService | undefined;

export const getAuth = (): AuthService =>
  (service ??= AUTH_PROVIDER === "better-auth" ? betterAuthService() : appwriteAuth());
