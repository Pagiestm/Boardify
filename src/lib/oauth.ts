"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { NEXT_COOKIE, safeNext } from "./safe-next";

const DESKTOP_COOKIE = "boardify-desktop";

type OAuthProvider = "google" | "github";

const startOAuth = async (provider: OAuthProvider, next?: string | null) => {
  const cookieStore = await cookies();
  const desktop = cookieStore.get(DESKTOP_COOKIE)?.value === "1";

  // Page à rouvrir une fois connecté (une invitation, par exemple).
  const target = safeNext(next);
  if (target) {
    cookieStore.set(NEXT_COOKIE, target, {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      maxAge: 600,
    });
  }

  // La route prépare la connexion selon le service utilisé (Appwrite ou Better Auth).
  redirect(
    `/api/auth/oauth/start?${new URLSearchParams({ provider, desktop: desktop ? "1" : "0" })}`,
  );
};

export async function signUpWithGithub(next?: string | null) {
  await startOAuth("github", next);
}

export async function signUpWithGoogle(next?: string | null) {
  await startOAuth("google", next);
}
