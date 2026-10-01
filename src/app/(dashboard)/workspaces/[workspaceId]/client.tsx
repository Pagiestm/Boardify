"use client";

import Link from "next/link";
import { fr } from "date-fns/locale";
import { format, isPast, isToday } from "date-fns";
import {
  ArrowRightIcon,
  CalendarIcon,
  FolderIcon,
  ListTodoIcon,
  PlusIcon,
  UsersIcon,
} from "lucide-react";

import { PopulatedTask, TaskStatus } from "@/features/tasks/types";
import { Member, MemberRole } from "@/features/members/types";
import { Project } from "@/features/projects/types";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateTaskModal } from "@/features/tasks/hooks/use-create-task-modal";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";
import { useGetWorkspaceAnalytics } from "@/features/workspaces/api/use-get-workspace-analytics";
import { resolveStatus, TaskStatusBadge } from "@/features/tasks/components/task-status-badge";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Analytics } from "@/components/analytics";
import { DueDates } from "@/components/charts/due-dates";
import { TasksByProject } from "@/components/charts/tasks-by-project";
import { WorkloadBars } from "@/components/charts/workload-bars";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";

export const WorkspaceIdClient = () => {
  const workspaceId = useWorkspaceId();

  const { data: analytics, isLoading: isLoadingAnalytics } = useGetWorkspaceAnalytics({
    workspaceId,
  });
  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({ workspaceId });
  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId });

  const isLoading = isLoadingAnalytics || isLoadingTasks || isLoadingProjects || isLoadingMembers;

  if (isLoading) {
    return <PageLoader />;
  }

  if (!analytics || !tasks || !projects || !members) {
    return <PageError message="Impossible de charger l'espace de travail" />;
  }

  return (
    <div className="flex h-full flex-col gap-6">
      <Analytics data={analytics} />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DueDates tasks={tasks.documents} />
        <TasksByProject tasks={tasks.documents} />
        <WorkloadBars tasks={tasks.documents} />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-5">
        <TaskList
          data={tasks.documents}
          total={tasks.total}
          className="xl:col-span-3 xl:row-span-2"
        />
        <ProjectList data={projects.documents} total={projects.total} className="xl:col-span-2" />
        <MemberList data={members.documents} total={members.total} className="xl:col-span-2" />
      </div>
    </div>
  );
};

interface PanelProps {
  title: string;
  count: number;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

const Panel = ({ title, count, action, className, children }: PanelProps) => (
  <section className={cn("flex flex-col rounded-lg border bg-card shadow-xs", className)}>
    <header className="flex items-center justify-between gap-3 border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="rounded-md bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
          {count}
        </span>
      </div>
      {action}
    </header>
    {children}
  </section>
);

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description: string;
  action?: React.ReactNode;
}

const EmptyState = ({ icon: Icon, title, description, action }: EmptyStateProps) => (
  <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">
    <div className="mb-3 flex size-10 items-center justify-center rounded-full bg-muted">
      <Icon className="size-5 text-muted-foreground" />
    </div>
    <p className="text-sm font-medium">{title}</p>
    <p className="mt-1 max-w-xs text-sm text-muted-foreground">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

const formatDueDate = (value: string) => {
  const date = new Date(value);
  if (isToday(date)) return "Aujourd'hui";
  return format(date, "d MMM", { locale: fr });
};

interface TaskListProps {
  data: PopulatedTask[];
  total: number;
  className?: string;
}

export const TaskList = ({ data, total, className }: TaskListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createTask } = useCreateTaskModal();

  return (
    <Panel
      title="Tâches assignées"
      count={total}
      className={className}
      action={
        <Button variant="ghost" size="sm" onClick={() => createTask()}>
          <PlusIcon />
          Nouvelle tâche
        </Button>
      }
    >
      {data.length === 0 ? (
        <EmptyState
          icon={ListTodoIcon}
          title="Aucune tâche"
          description="Créez une première tâche pour commencer à suivre votre travail."
          action={
            <Button size="sm" onClick={() => createTask()}>
              <PlusIcon />
              Nouvelle tâche
            </Button>
          }
        />
      ) : (
        <>
          <ul className="divide-y">
            {data.slice(0, 8).map((task) => {
              const dueDate = task.dueDate ? new Date(task.dueDate) : null;
              const isLate =
                !!dueDate &&
                task.status !== TaskStatus.DONE &&
                isPast(dueDate) &&
                !isToday(dueDate);

              return (
                <li key={task.$id}>
                  <Link
                    href={`/workspaces/${workspaceId}/tasks/${task.$id}`}
                    className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-accent/60"
                  >
                    <span
                      aria-hidden
                      className={cn(
                        "size-2 shrink-0 rounded-full",
                        resolveStatus(task.status, task.statusColumn).dot,
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{task.name}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        {task.project && (
                          <span className="flex min-w-0 items-center gap-1.5">
                            <ProjectAvatar
                              name={task.project.name}
                              image={task.project.imageUrl}
                              className="size-4"
                              fallbackClassName="text-[9px]"
                            />
                            <span className="truncate">{task.project.name}</span>
                          </span>
                        )}
                        {dueDate && (
                          <span
                            className={cn(
                              "flex shrink-0 items-center gap-1",
                              isLate && "text-destructive",
                            )}
                          >
                            <CalendarIcon className="size-3" />
                            {formatDueDate(task.dueDate)}
                          </span>
                        )}
                      </div>
                    </div>
                    <TaskStatusBadge
                      status={task.status}
                      column={task.statusColumn}
                      className="hidden sm:inline-flex"
                    />
                    <MemberAvatar
                      name={task.assignee?.name}
                      className="size-6"
                      fallbackClassName="text-[10px]"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-auto border-t px-4 py-2.5">
            <Link
              href={`/workspaces/${workspaceId}/tasks`}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Voir toutes les tâches
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </>
      )}
    </Panel>
  );
};

interface ProjectListProps {
  data: Project[];
  total: number;
  className?: string;
}

export const ProjectList = ({ data, total, className }: ProjectListProps) => {
  const workspaceId = useWorkspaceId();
  const { open: createProject } = useCreateProjectModal();

  return (
    <Panel
      title="Projets"
      count={total}
      className={className}
      action={
        <Button variant="ghost" size="icon-sm" onClick={createProject} aria-label="Créer un projet">
          <PlusIcon />
        </Button>
      }
    >
      {data.length === 0 ? (
        <EmptyState
          icon={FolderIcon}
          title="Aucun projet"
          description="Regroupez vos tâches par projet."
          action={
            <Button size="sm" variant="outline" onClick={createProject}>
              <PlusIcon />
              Créer un projet
            </Button>
          }
        />
      ) : (
        <ul className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2">
          {data.map((project) => (
            <li key={project.$id}>
              <Link
                href={`/workspaces/${workspaceId}/projects/${project.$id}`}
                className="flex items-center gap-3 rounded-md border p-3 transition-colors hover:bg-accent/60"
              >
                <ProjectAvatar
                  className="size-8"
                  fallbackClassName="text-sm"
                  name={project.name}
                  image={project.imageUrl}
                />
                <span className="min-w-0 truncate text-sm font-medium">{project.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

interface MemberListProps {
  data: Member[];
  total: number;
  className?: string;
}

export const MemberList = ({ data, total, className }: MemberListProps) => {
  const workspaceId = useWorkspaceId();

  return (
    <Panel
      title="Membres"
      count={total}
      className={className}
      action={
        <Button asChild variant="ghost" size="sm">
          <Link href={`/workspaces/${workspaceId}/members`}>Gérer</Link>
        </Button>
      }
    >
      {data.length === 0 ? (
        <EmptyState
          icon={UsersIcon}
          title="Aucun membre"
          description="Invitez votre équipe depuis les paramètres de l'espace."
        />
      ) : (
        <ul className="divide-y">
          {data.map((member) => (
            <li key={member.$id} className="flex items-center gap-3 px-4 py-3">
              <MemberAvatar className="size-8" fallbackClassName="text-xs" name={member.name} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.name ?? "Membre"}</p>
                <p className="truncate text-xs text-muted-foreground">{member.email}</p>
              </div>
              {member.role === MemberRole.ADMIN && <Badge variant="secondary">Admin</Badge>}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};
