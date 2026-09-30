import { redirect } from "next/navigation";

import { Card } from "@/components/ui/card";
import { getCurrent } from "@/features/auth/queries";
import { CreateWorkspaceForm } from "@/features/workspaces/components/create-workspace-form";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage(
  "Nouvel espace de travail",
  "Créez un espace de travail pour votre équipe.",
);

const WorkspaceCreatePage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  const firstName = user.name?.split(" ")[0];

  return (
    <div className="w-full max-w-xl">
      <div className="mb-6 space-y-1 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Bienvenue{firstName ? `, ${firstName}` : ""} 👋
        </h1>
        <p className="text-sm text-muted-foreground">
          Créez votre premier espace de travail pour commencer à organiser vos projets.
        </p>
      </div>
      <Card>
        <CreateWorkspaceForm />
      </Card>
    </div>
  );
};

export default WorkspaceCreatePage;
