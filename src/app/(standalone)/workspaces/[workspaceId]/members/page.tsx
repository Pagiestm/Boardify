import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { MembersList } from "@/features/workspaces/components/members-list";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage("Membres", "Gérez les membres de l'espace de travail.");

const WorkspaceIdMembersPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return (
    <div className="w-full max-w-2xl">
      <MembersList />
    </div>
  );
};

export default WorkspaceIdMembersPage;
