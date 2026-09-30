import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { ProjectIdClient } from "./client";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage("Projet", "Les tâches de ce projet.");

const ProjectIdPage = async () => {
  const user = await getCurrent();
  if (!user) {
    redirect("/sign-in");
  }

  return <ProjectIdClient />;
};

export default ProjectIdPage;
