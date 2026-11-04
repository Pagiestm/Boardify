import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { ProjectDocs } from "@/features/docs/components/project-docs";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage("Documentation", "Les pages de documentation du projet.");

const ProjectDocsPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <ProjectDocs />;
};

export default ProjectDocsPage;
