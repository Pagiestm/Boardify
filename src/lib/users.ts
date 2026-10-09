import "server-only";

import { unstable_cache } from "next/cache";
import { type Users } from "node-appwrite";

const IDENTITY_TTL = 10 * 60;

export interface UserIdentity {
  name: string;
  email: string;
}

export const getUserIdentity = (users: Users, userId: string) =>
  unstable_cache(
    async (): Promise<UserIdentity> => {
      const user = await users.get(userId);

      return { name: user.name || user.email, email: user.email };
    },
    ["user-identity", userId],
    { revalidate: IDENTITY_TTL, tags: [`user-identity:${userId}`] },
  )();

export const getUserIdentities = async (users: Users, userIds: string[]) => {
  const unique = [...new Set(userIds)];
  const identities = await Promise.all(unique.map((userId) => getUserIdentity(users, userId)));

  return new Map(unique.map((userId, index) => [userId, identities[index]]));
};
