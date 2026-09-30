import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";

import { WorkspaceIdJoinClient } from "./client";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage(
  "Rejoindre l'espace",
  "Rejoignez un espace de travail sur invitation.",
);

const WorspacesIdJoinPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <WorkspaceIdJoinClient />;
};

export default WorspacesIdJoinPage;
