import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { SignUpCard } from "@/features/auth/components/sign-up-card";

import { publicPage } from "@/lib/metadata";
import { safeNext } from "@/lib/safe-next";

export const metadata = publicPage(
  "Créer un compte",
  "Créez gratuitement votre compte Boardify et organisez vos projets en équipe.",
  "/sign-up",
);

interface AuthPageProps {
  searchParams: Promise<{ next?: string }>;
}

const SignUpPage = async ({ searchParams }: AuthPageProps) => {
  const next = safeNext((await searchParams).next);
  const user = await getCurrent();

  if (user) redirect(next ?? "/dashboard");

  return <SignUpCard next={next} />;
};

export default SignUpPage;
