import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";

import { WorkspaceIdJoinClient } from "./client";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage(
  "Rejoindre l'espace",
  "Rejoignez un espace de travail sur invitation.",
);

interface JoinPageProps {
  params: Promise<{ workspaceId: string; inviteCode: string }>;
}

const WorspacesIdJoinPage = async ({ params }: JoinPageProps) => {
  const user = await getCurrent();

  if (!user) {
    // Après connexion ou inscription, la personne revient directement sur l'invitation.
    const { workspaceId, inviteCode } = await params;
    redirect(
      `/sign-in?next=${encodeURIComponent(`/workspaces/${workspaceId}/join/${inviteCode}`)}`,
    );
  }

  return <WorkspaceIdJoinClient />;
};

export default WorspacesIdJoinPage;
