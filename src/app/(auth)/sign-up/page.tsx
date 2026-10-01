import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { SignUpCard } from "@/features/auth/components/sign-up-card";

import { publicPage } from "@/lib/metadata";

export const metadata = publicPage(
  "Créer un compte",
  "Créez gratuitement votre compte Boardify et organisez vos projets en équipe.",
  "/sign-up",
);

const SignUpPage = async () => {
  const user = await getCurrent();

  if (user) redirect("/dashboard");

  return <SignUpCard />;
};

export default SignUpPage;
