import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { SignInCard } from "@/features/auth/components/sign-in-card";

import { publicPage } from "@/lib/metadata";

export const metadata = publicPage(
  "Connexion",
  "Connectez-vous à Boardify avec votre e-mail, Google ou GitHub.",
  "/sign-in",
);

const SignInPage = async () => {
  const user = await getCurrent();

  if (user) redirect("/dashboard");

  return <SignInCard />;
};

export default SignInPage;
