/** Service de connexion : Appwrite par défaut, Better Auth avec `AUTH_PROVIDER=better-auth`. */
export const AUTH_PROVIDER: "appwrite" | "better-auth" =
  process.env.AUTH_PROVIDER === "better-auth" ? "better-auth" : "appwrite";
