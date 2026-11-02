import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { SignInCard } from "@/features/auth/components/sign-in-card";

import { publicPage } from "@/lib/metadata";
import { safeNext } from "@/lib/safe-next";

export const metadata = publicPage(
  "Connexion",
  "Connectez-vous à Boardify avec votre e-mail, Google ou GitHub.",
  "/sign-in",
);

interface AuthPageProps {
  searchParams: Promise<{ next?: string }>;
}

const SignInPage = async ({ searchParams }: AuthPageProps) => {
  const next = safeNext((await searchParams).next);
  const user = await getCurrent();

  if (user) redirect(next ?? "/dashboard");

  return <SignInCard next={next} />;
};

export default SignInPage;
