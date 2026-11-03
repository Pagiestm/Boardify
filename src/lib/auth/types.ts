/**
 * Connexion et comptes, indépendants du service utilisé (Appwrite aujourd'hui, Better Auth en
 * option). Une session est identifiée par un jeton, gardé dans le cookie AUTH_COOKIE.
 */

/** Utilisateur connecté, tel que l'application le voit. */
export interface AuthUser {
  $id: string;
  name: string;
  email: string;
  /** Préférences libres (photo de profil, compte GitHub…). */
  prefs: Record<string, unknown>;
  /** Faux pour un compte créé avec Google ou GitHub sans mot de passe. */
  hasPassword: boolean;
  /** Date d'inscription (ISO). */
  createdAt: string;
}

export type OAuthProviderName = "google" | "github";

/** Compte Google ou GitHub relié à l'utilisateur. */
export interface AuthIdentity {
  id: string;
  provider: string;
  /** Identifiant de l'utilisateur chez le fournisseur. */
  providerUid: string;
  email: string;
  createdAt: string;
}

/** Actions de l'utilisateur sur son propre compte. */
export interface AccountActions {
  updateName(name: string): Promise<void>;
  /** Le mot de passe actuel est demandé pour confirmer. */
  updateEmail(email: string, password: string): Promise<void>;
  /** Sans ancien mot de passe : définit le premier mot de passe d'un compte Google ou GitHub. */
  updatePassword(password: string, oldPassword?: string): Promise<void>;
  updatePrefs(prefs: Record<string, unknown>): Promise<void>;
  listIdentities(): Promise<AuthIdentity[]>;
  deleteIdentity(identityId: string): Promise<void>;
  /** Bloque le compte : plus aucune connexion possible. */
  block(): Promise<void>;
}

/** Actions côté serveur sur n'importe quel compte. */
export interface AdminActions {
  getUser(userId: string): Promise<AuthUser>;
  listIdentities(userId: string, provider?: OAuthProviderName): Promise<AuthIdentity[]>;
  deleteUser(userId: string): Promise<void>;
}

export interface AuthService {
  /** Connexion par e-mail et mot de passe ; renvoie le jeton de session. */
  signIn(email: string, password: string): Promise<string>;
  /** Création du compte puis connexion ; renvoie le jeton de session. */
  signUp(input: { name: string; email: string; password: string }): Promise<string>;
  /** Utilisateur de la session ; erreur si elle n'est pas valide. */
  getUser(token: string): Promise<AuthUser>;
  signOut(token: string): Promise<void>;

  /**
   * Adresse où envoyer le navigateur pour se connecter avec Google ou GitHub. Au retour, la page
   * `success` reçoit `userId` et `secret`, à échanger contre une session avec `exchangeToken`.
   * `cookies` : en-têtes Set-Cookie à transmettre au navigateur avant la redirection.
   */
  startOAuth(
    provider: OAuthProviderName,
    urls: { success: string; failure: string },
  ): Promise<{ url: string; cookies?: string[] }>;
  /** Échange un jeton à usage unique (retour OAuth, application desktop) contre une session. */
  exchangeToken(userId: string, secret: string): Promise<string>;

  /** Envoie le lien de réinitialisation ; ne dit jamais si l'adresse existe. */
  requestRecovery(email: string, resetUrl: string): Promise<void>;
  confirmRecovery(userId: string, secret: string, password: string): Promise<void>;

  account(token: string, user: AuthUser): AccountActions;
  admin: AdminActions;
}
