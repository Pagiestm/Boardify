"use client";

import Link from "next/link";
import { SettingsIcon } from "lucide-react";

import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { TaskViewSwitcher } from "@/features/tasks/components/task-view-switcher";

import { Button } from "@/components/ui/button";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

export const ProjectIdClient = () => {
  const projectId = useProjectId();
  const { data: project, isLoading: isLoadingProject } = useGetProject({ projectId });

  const isLoading = isLoadingProject;

  if (isLoading) {
    return <PageLoader />;
  }

  if (!project) {
    return (
      <PageError
        message="Projet introuvable"
        description="Ce projet n'existe pas ou vous n'y avez pas accès."
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <ProjectAvatar
            name={project.name}
            image={project.imageUrl}
            className="size-9"
            fallbackClassName="text-sm"
          />
          <h1 className="truncate text-xl font-semibold tracking-tight">{project.name}</h1>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/workspaces/${project.workspaceId}/projects/${project.$id}/settings`}>
            <SettingsIcon />
            Paramètres
          </Link>
        </Button>
      </div>
      <TaskViewSwitcher hideProjectFilter />
    </div>
  );
};
