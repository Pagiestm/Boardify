import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";

import { privatePage } from "@/lib/metadata";

import { DesktopOAuthRedirect } from "./desktop-oauth-redirect";

export const metadata: Metadata = {
  ...privatePage("Connexion réussie"),
  referrer: "no-referrer",
};

interface DesktopOAuthPageProps {
  searchParams: Promise<{ userId?: string; secret?: string }>;
}

const DesktopOAuthPage = async ({ searchParams }: DesktopOAuthPageProps) => {
  const { userId, secret } = await searchParams;

  if (!userId || !secret) redirect("/sign-up");

  const deepLink = `boardify://oauth?${new URLSearchParams({ userId, secret })}`;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 px-4">
      <Logo />
      <DesktopOAuthRedirect deepLink={deepLink} />
    </main>
  );
};

export default DesktopOAuthPage;
