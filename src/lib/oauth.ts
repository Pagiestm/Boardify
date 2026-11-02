"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { OAuthProvider } from "node-appwrite";

import { NEXT_COOKIE, safeNext } from "./safe-next";

const DESKTOP_COOKIE = "boardify-desktop";

const buildOAuthUrl = (provider: OAuthProvider, origin: string, desktop: boolean) => {
  const url = new URL(
    `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/account/tokens/oauth2/${provider}`,
  );

  url.searchParams.set("project", process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);
  url.searchParams.set("success", `${origin}/oauth${desktop ? "/desktop" : ""}`);
  url.searchParams.set("failure", `${origin}/sign-up`);

  return url.toString();
};

const startOAuth = async (provider: OAuthProvider, next?: string | null) => {
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL!;
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

  redirect(buildOAuthUrl(provider, origin, desktop));
};

export async function signUpWithGithub(next?: string | null) {
  await startOAuth(OAuthProvider.Github, next);
}

export async function signUpWithGoogle(next?: string | null) {
  await startOAuth(OAuthProvider.Google, next);
}
