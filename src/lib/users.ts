import "server-only";

import { revalidateTag, unstable_cache } from "next/cache";
import { type Users } from "node-appwrite";

import { avatarUrl } from "./avatar";

const IDENTITY_TTL = 10 * 60;

export interface UserIdentity {
  name: string;
  email: string;
  /** Adresse de la photo de profil, si l'utilisateur en a une. */
  avatarUrl?: string;
}

export const forgetUserIdentity = (userId: string) =>
  revalidateTag(`user-identity:${userId}`, { expire: 0 });

export const getUserIdentity = (users: Users, userId: string) =>
  unstable_cache(
    async (): Promise<UserIdentity> => {
      const user = await users.get(userId);

      return {
        name: user.name || user.email,
        email: user.email,
        avatarUrl: avatarUrl(userId, user.prefs?.avatarId),
      };
    },
    ["user-identity", userId],
    { revalidate: IDENTITY_TTL, tags: [`user-identity:${userId}`] },
  )();

export const getUserIdentities = async (users: Users, userIds: string[]) => {
  const unique = [...new Set(userIds)];
  const identities = await Promise.all(unique.map((userId) => getUserIdentity(users, userId)));

  return new Map(unique.map((userId, index) => [userId, identities[index]]));
};
