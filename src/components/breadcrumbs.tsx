"use client";

import Link from "next/link";
import { Fragment } from "react";
import { usePathname } from "next/navigation";
import { ChevronRightIcon } from "lucide-react";

import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

interface Crumb {
  label: string;
  href?: string;
}

const SECTION_LABELS: Record<string, string> = {
  tasks: "Mes tâches",
  members: "Membres",
  settings: "Paramètres",
  projects: "Projets",
};

export const Breadcrumbs = () => {
  const pathname = usePathname();
  const workspaceId = useWorkspaceId();
  const { data: projects } = useGetProjects({ workspaceId });

  const root = `/workspaces/${workspaceId}`;
  const segments = pathname.startsWith(root)
    ? pathname.slice(root.length).split("/").filter(Boolean)
    : [];

  const crumbs: Crumb[] = [{ label: "Accueil", href: root }];

  if (segments[0] === "projects" && segments[1]) {
    const project = projects?.documents.find((item) => item.$id === segments[1]);
    crumbs.push({ label: project?.name ?? "Projet", href: `${root}/projects/${segments[1]}` });
    if (segments[2] === "settings") crumbs.push({ label: "Paramètres" });
  } else if (segments[0] === "tasks" && segments[1]) {
    crumbs.push({ label: "Mes tâches", href: `${root}/tasks` });
    crumbs.push({ label: "Tâche" });
  } else if (segments[0]) {
    crumbs.push({ label: SECTION_LABELS[segments[0]] ?? segments[0] });
  }

  if (crumbs.length === 1) return null;

  return (
    <nav aria-label="Fil d'Ariane" className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;

          return (
            <Fragment key={`${crumb.label}-${index}`}>
              <li className="min-w-0 shrink-0 last:min-w-0 last:truncate">
                {crumb.href && !isLast ? (
                  <Link href={crumb.href} className="transition-colors hover:text-foreground">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current="page" className="text-foreground">
                    {crumb.label}
                  </span>
                )}
              </li>
              {!isLast && <ChevronRightIcon aria-hidden className="size-3 shrink-0" />}
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
