import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";

import { WorkspaceIdClient } from "./client";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage("Tableau de bord", "Vue d'ensemble de vos projets et tâches.");

const WorkspaceIdPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <WorkspaceIdClient />;
};

export default WorkspaceIdPage;
