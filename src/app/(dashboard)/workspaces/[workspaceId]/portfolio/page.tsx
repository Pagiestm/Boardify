import { redirect } from "next/navigation";

import { getCurrent } from "@/features/auth/queries";
import { PortfolioView } from "@/features/portfolio/components/portfolio-view";

import { privatePage } from "@/lib/metadata";

export const metadata = privatePage(
  "Portefeuille",
  "L'avancement et la santé de tous les projets de l'espace.",
);

const WorkspacePortfolioPage = async () => {
  const user = await getCurrent();
  if (!user) redirect("/sign-in");

  return <PortfolioView />;
};

export default WorkspacePortfolioPage;
