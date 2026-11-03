/** Raisons d'échec communes aux services de connexion. */
export type AuthErrorReason =
  | "invalid_credentials"
  | "email_taken"
  | "password_recently_used"
  | "password_personal_data"
  | "invalid_token"
  | "invalid_value"
  | "unauthorized"
  /** La clé d'API n'a pas le droit nécessaire (Appwrite). */
  | "missing_scope"
  | "unknown";

export class AuthError extends Error {
  constructor(
    readonly reason: AuthErrorReason,
    message: string = reason,
    options?: { cause?: unknown },
  ) {
    super(message, options);
    this.name = "AuthError";
  }
}

export const isAuthError = (error: unknown, reason?: AuthErrorReason): error is AuthError =>
  error instanceof AuthError && (reason === undefined || error.reason === reason);
