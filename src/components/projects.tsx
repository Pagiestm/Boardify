"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";

export const Projects = () => {
  const pathname = usePathname();
  const { open } = useCreateProjectModal();
  const workspaceId = useWorkspaceId();
  const { data, isLoading } = useGetProjects({
    workspaceId,
  });

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between px-2.5">
        <p className="text-xs font-medium text-muted-foreground">Projets</p>
        <button
          type="button"
          onClick={open}
          aria-label="Créer un projet"
          className="rounded-sm p-0.5 text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <PlusIcon className="size-4" />
        </button>
      </div>
      <ul className="flex flex-col gap-0.5">
        {isLoading &&
          Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-center gap-2.5 px-2.5 py-1.5">
              <Skeleton className="size-5" />
              <Skeleton className="h-3.5 flex-1" />
            </li>
          ))}
        {data?.documents.map((project) => {
          const href = `/workspaces/${workspaceId}/projects/${project.$id}`;
          const isActive = pathname === href;

          return (
            <li key={project.$id}>
              <Link
                href={href}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                )}
              >
                <ProjectAvatar
                  image={project.imageUrl}
                  name={project.name}
                  className="size-5"
                  fallbackClassName="text-[10px]"
                />
                <span className="truncate">{project.name}</span>
              </Link>
            </li>
          );
        })}
        {data?.documents.length === 0 && (
          <li>
            <button
              type="button"
              onClick={open}
              className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
            >
              <PlusIcon className="size-4" />
              Créer un projet
            </button>
          </li>
        )}
      </ul>
    </div>
  );
};
