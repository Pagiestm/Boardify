"use client";

import { useState } from "react";
import Link from "next/link";
import { SettingsIcon } from "lucide-react";

import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { TaskViewSwitcher } from "@/features/tasks/components/task-view-switcher";
import { SprintBar } from "@/features/sprints/components/sprint-bar";
import { NO_SPRINT } from "@/features/sprints/types";
import { useGetSprints } from "@/features/sprints/api/use-sprints";
import { useTaskFilters } from "@/features/tasks/hooks/use-task-filters";
import { useAssistantReady } from "@/features/assistant/api/use-assistant";
import {
  ProjectAssistantDialog,
  ProjectAssistantMenu,
  type ProjectAssistantAction,
} from "@/features/assistant/components/project-assistant-menu";

import { Button } from "@/components/ui/button";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

export const ProjectIdClient = () => {
  const projectId = useProjectId();
  const { data: project, isLoading: isLoadingProject } = useGetProject({ projectId });
  const [dialog, setDialog] = useState<ProjectAssistantAction | null>(null);
  const [{ sprintId }] = useTaskFilters();
  const { data: sprints } = useGetSprints({ projectId });
  const assistantReady = useAssistantReady(project?.workspaceId);
  const sprint =
    sprintId && sprintId !== NO_SPRINT
      ? (sprints?.find((candidate) => candidate.$id === sprintId) ?? null)
      : null;

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
        <div className="flex flex-wrap gap-2">
          {assistantReady && <ProjectAssistantMenu onSelect={setDialog} />}
          <Button variant="outline" size="sm" asChild>
            <Link href={`/workspaces/${project.workspaceId}/projects/${project.$id}/settings`}>
              <SettingsIcon />
              Paramètres
            </Link>
          </Button>
        </div>
      </div>
      {dialog && (
        <ProjectAssistantDialog
          action={dialog}
          project={project}
          sprint={sprint}
          onClose={() => setDialog(null)}
        />
      )}
      <SprintBar workspaceId={project.workspaceId} projectId={project.$id} />
      <TaskViewSwitcher hideProjectFilter />
    </div>
  );
};
