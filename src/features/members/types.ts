import type { BaseDocument } from "@/lib/db/types";

export enum MemberRole {
  ADMIN = "ADMIN",
  MEMBER = "MEMBER",
}

export type Member = BaseDocument & {
  workspaceId: string;
  userId: string;
  role: MemberRole;
  name?: string;
  email?: string;
  /** Photo de profil, quand l'utilisateur en a une. */
  avatarUrl?: string;
};
