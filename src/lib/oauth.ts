"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { OAuthProvider } from "node-appwrite";

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

const startOAuth = async (provider: OAuthProvider) => {
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL!;
  const desktop = (await cookies()).get(DESKTOP_COOKIE)?.value === "1";

  redirect(buildOAuthUrl(provider, origin, desktop));
};

export async function signUpWithGithub() {
  await startOAuth(OAuthProvider.Github);
}

export async function signUpWithGoogle() {
  await startOAuth(OAuthProvider.Google);
}
