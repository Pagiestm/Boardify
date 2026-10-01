"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { OAuthProvider } from "node-appwrite";

const buildOAuthUrl = (provider: OAuthProvider, origin: string) => {
  const url = new URL(
    `${process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT}/account/tokens/oauth2/${provider}`,
  );

  url.searchParams.set("project", process.env.NEXT_PUBLIC_APPWRITE_PROJECT!);
  url.searchParams.set("success", `${origin}/oauth`);
  url.searchParams.set("failure", `${origin}/sign-up`);

  return url.toString();
};

const startOAuth = async (provider: OAuthProvider) => {
  const origin = (await headers()).get("origin") ?? process.env.NEXT_PUBLIC_APP_URL!;

  redirect(buildOAuthUrl(provider, origin));
};

export async function signUpWithGithub() {
  await startOAuth(OAuthProvider.Github);
}

export async function signUpWithGoogle() {
  await startOAuth(OAuthProvider.Google);
}
