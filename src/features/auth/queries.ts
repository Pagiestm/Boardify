import { cookies } from "next/headers";

import { getAuth } from "@/lib/auth";

import { AUTH_COOKIE } from "./constants";

/** Utilisateur connecté (composants serveur), ou null. */
export const getCurrent = async () => {
  const session = (await cookies()).get(AUTH_COOKIE)?.value;
  if (!session) return null;

  try {
    return await getAuth().getUser(session);
  } catch {
    return null;
  }
};
