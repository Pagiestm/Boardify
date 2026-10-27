import "server-only";

import { unstable_cache, revalidateTag } from "next/cache";
import { Query, type Users } from "node-appwrite";

import { getGithubLoginById } from "@/lib/github";

const LOGIN_TTL = 10 * 60;

export type GithubAccountPrefs = { githubLogin?: string; githubId?: string };

const loginTag = (userId: string) => `github-login:${userId}`;

export const forgetGithubLogin = (userId: string) => revalidateTag(loginTag(userId), { expire: 0 });

// Compte GitHub d'un utilisateur Boardify : celui qu'il a lié lui-même, sinon celui avec
// lequel il s'est inscrit (identité GitHub Appwrite).
export const resolveGithubAccount = (users: Users, userId: string, installationId?: string) =>
  unstable_cache(
    async (): Promise<{ login: string; linked: boolean } | null> => {
      const user = await users.get(userId);
      const { githubLogin } = user.prefs as GithubAccountPrefs;
      if (githubLogin) return { login: githubLogin, linked: true };

      if (!installationId) return null;

      const { identities } = await users.listIdentities([
        Query.equal("userId", userId),
        Query.equal("provider", "github"),
        Query.limit(1),
      ]);
      if (identities.length === 0) return null;

      return {
        login: await getGithubLoginById(installationId, identities[0].providerUid),
        linked: false,
      };
    },
    ["github-login", userId, installationId ?? ""],
    { revalidate: LOGIN_TTL, tags: [loginTag(userId)] },
  )();
