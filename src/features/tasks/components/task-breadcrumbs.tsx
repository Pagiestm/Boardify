import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRightIcon, TrashIcon } from "lucide-react";

import { Project } from "@/features/projects/types";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";

import { PopulatedTask } from "../types";
import { useDeleteTask } from "../api/use-delete-task";

interface TaskBreadcrumbsProps {
  project?: Project;
  task: PopulatedTask;
}

export const TaskBreadcrumbs = ({ project, task }: TaskBreadcrumbsProps) => {
  const router = useRouter();
  const workspaceId = useWorkspaceId();

  const { mutate, isPending } = useDeleteTask();
  const [ConfirmDialog, confirm] = useConfirm(
    "Supprimer la tâche ?",
    "Cette action est définitive et ne peut pas être annulée.",
    "destructive",
  );

  const handleDeleteTask = async () => {
    const ok = await confirm();
    if (!ok) return;

    mutate(
      { param: { taskId: task.$id } },
      {
        onSuccess: () => {
          router.push(`/workspaces/${workspaceId}/tasks`);
        },
      },
    );
  };

  return (
    <div className="flex items-center gap-x-3">
      <ConfirmDialog />
      <nav aria-label="Fil d'Ariane" className="flex min-w-0 items-center gap-x-2 text-sm">
        {project ? (
          <Link
            href={`/workspaces/${workspaceId}/projects/${project.$id}`}
            className="flex min-w-0 items-center gap-x-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ProjectAvatar name={project.name} image={project.imageUrl} className="size-5" />
            <span className="truncate">{project.name}</span>
          </Link>
        ) : (
          <Link
            href={`/workspaces/${workspaceId}/tasks`}
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Mes tâches
          </Link>
        )}
        <ChevronRightIcon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
        <h1 className="truncate font-semibold">{task.name}</h1>
      </nav>
      <Button
        onClick={handleDeleteTask}
        disabled={isPending}
        className="ml-auto shrink-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
        variant="outline"
        size="sm"
      >
        <TrashIcon />
        <span className="hidden sm:inline">Supprimer</span>
      </Button>
    </div>
  );
};
