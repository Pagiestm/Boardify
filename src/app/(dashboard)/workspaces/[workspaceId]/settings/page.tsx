import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";

import { WorkspaceIdSettingsClient } from "./client";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage("Paramètres de l'espace", "Gérez votre espace de travail.");

const workspaceIdSettingsPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <WorkspaceIdSettingsClient />;
};

export default workspaceIdSettingsPage;
