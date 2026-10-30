import { Models } from "node-appwrite";

export enum MemberRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export type Member = Models.Document & {
  workspaceId: string;
  userId: string;
  role: MemberRole;
  name?: string;
  email?: string;
  /** Photo de profil, quand l'utilisateur en a une. */
  avatarUrl?: string;
};
