import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { AccountPage } from "@/features/account/components/account-page";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage(
  "Mon compte",
  "Gérez votre profil, votre sécurité et vos espaces.",
);

const WorkspaceIdAccountPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <AccountPage />;
};

export default WorkspaceIdAccountPage;
