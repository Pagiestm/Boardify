"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CalendarIcon, PlusIcon, SettingsIcon } from "lucide-react";

import { Task } from "@/features/tasks/types";
import { Member } from "@/features/members/types";
import { Project } from "@/features/projects/types";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useCreateTaskModal } from "@/features/tasks/hooks/use-create-task-modal";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";
import { useGetWorkspaceAnalytics } from "@/features/workspaces/api/use-get-workspace-analytics";

import { Button } from "@/components/ui/button";
import { Analytics } from "@/components/analytics";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { Card, CardContent } from "@/components/ui/card";
import { DottedSeparator } from "@/components/dotted-separator";
import { MemberAvatar } from "@/features/members/components/member-avatar";

export const WorkspaceIdClient = () => {
    const workspaceId = useWorkspaceId();

    const { data: analytics, isLoading: isLoadingAnalytics } = useGetWorkspaceAnalytics({ workspaceId })
    const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({ workspaceId })
    const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId })
    const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId })

    const isLoading =
        isLoadingAnalytics ||
        isLoadingTasks ||
        isLoadingProjects ||
        isLoadingMembers

    if (isLoading) {
        return <PageLoader />
    }

    if (!analytics || !tasks || !projects || !members) {
        return <PageError message="Failed to load workspace data" />
    }

    return (
        <div className="h-full flex flex-col space-y-4">
            <Analytics data={analytics} />
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <TaskList data={tasks.documents} total={tasks.total} />
                <ProjectList data={projects.documents} total={projects.total} />
                <MemberList data={members.documents} total={members.total} />
            </div>
        </div>
    )
}

interface TaskListProps {
    data: Task[];
    total: number;
}

export const TaskList = ({ data, total }: TaskListProps) => {
    const workspaceId = useWorkspaceId()
    const { open: createTask } = useCreateTaskModal()

    return (
        <div className="flex flex-col gap-y-4 col-span-1">
            <div className="bg-card rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-foreground">
                        Tâches ({total})
                    </p>
                    <Button variant="ghost" size="icon" onClick={createTask}>
                        <PlusIcon className="size-4" />
                    </Button>
                </div>
                <DottedSeparator className="my-4" />
                <ul className="flex flex-col gap-y-4">
                    {data.map((task) => (
                        <li key={task.$id}>
                            <Link href={`/workspaces/${workspaceId}/tasks/${task.$id}`}>
                                <Card className="shadow-none hover:bg-muted/50 transition">
                                    <CardContent className="p-4">
                                        <p className="text-lg font-medium truncate text-foreground">{task.name}</p>
                                        <div className="flex items-center gap-x-2">
                                            <p className="text-muted-foreground">{task.project?.name}</p>
                                            <div className="size-1 rounded-full bg-border" />
                                            <div className="text-sm text-muted-foreground flex items-center">
                                                <CalendarIcon className="size-3 mr-1" />
                                                <span className="truncate">
                                                    {formatDistanceToNow(new Date(task.dueDate))}
                                                </span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        </li>
                    ))}
                    <li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
                        Aucune tâche trouvée
                    </li>
                </ul>
                <Button variant="outline" className="mt-4 w-full" asChild>
                    <Link href={`/workspaces/${workspaceId}/tasks`}>
                        Voir tout
                    </Link>
                </Button>
            </div>
        </div>
    )
}

interface ProjectListProps {
    data: Project[];
    total: number;
}

export const ProjectList = ({ data, total }: ProjectListProps) => {
    const workspaceId = useWorkspaceId()
    const { open: createProject } = useCreateProjectModal()

    return (
        <div className="flex flex-col gap-y-4 col-span-1">
            <div className="bg-card rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-foreground">
                        Projets ({total})
                    </p>
                    <Button variant="ghost" size="icon" onClick={createProject}>
                        <PlusIcon className="size-4" />
                    </Button>
                </div>
                <DottedSeparator className="my-4" />
                <ul className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {data.map((project) => (
                        <li key={project.$id}>
                            <Link href={`/workspaces/${workspaceId}/projects/${project.$id}`}>
                                <Card className="shadow-none hover:bg-muted/50 transition">
                                    <CardContent className="p-4 flex items-center gap-x-2.5">
                                        <ProjectAvatar
                                            className="size-12"
                                            fallbackClassName="text-lg"
                                            name={project.name}
                                            image={project.imageUrl}
                                        />
                                        <p className="text-lg font-medium truncate text-foreground">
                                            {project.name}
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </li>
                    ))}
                    <li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
                        Aucun projet trouvé
                    </li>
                </ul>
            </div>
        </div>
    )
}

interface MemberListProps {
    data: Member[];
    total: number;
}

export const MemberList = ({ data, total }: MemberListProps) => {
    const workspaceId = useWorkspaceId()

    return (
        <div className="flex flex-col gap-y-4 col-span-1">
            <div className="bg-card rounded-lg p-4 border">
                <div className="flex items-center justify-between">
                    <p className="text-lg font-semibold text-foreground">
                        Membres ({total})
                    </p>
                    <Button asChild variant="ghost" size="icon">
                        <Link href={`/workspaces/${workspaceId}/members`}>
                            <SettingsIcon className="size-4" />
                        </Link>
                    </Button>
                </div>
                <DottedSeparator className="my-4" />
                <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {data.map((member) => (
                        <li key={member.$id}>
                            <Card className="shadow-none overflow-hidden hover:bg-muted/50 transition">
                                <CardContent className="p-3 flex flex-col items-center gap-x-2">
                                    <MemberAvatar
                                        className="size-12"
                                        name={member.name}
                                    />
                                    <div className="flex flex-col items-center overflow-hidden">
                                        <p className="text-lg font-medium line-clamp-1 text-foreground">
                                            {member.name}
                                        </p>
                                        <p className="text-sm text-muted-foreground line-clamp-1">
                                            {member.email}
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>
                        </li>
                    ))}
                    <li className="text-sm text-muted-foreground text-center hidden first-of-type:block">
                        Aucun membre trouvé
                    </li>
                </ul>
            </div>
        </div>
    )
}