"use client"

import { Skeleton } from "@/components/ui/skeleton";

import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { EditTaskForm } from "./edit-task-form";

import { useGetTask } from "../api/use-get-task";

export const TaskFormSkeleton = () => (
    <div className="w-full" aria-busy="true" aria-label="Chargement du formulaire">
        <div className="space-y-2 px-6 pt-6 pb-5">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-5 px-6 pb-6 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={i === 0 || i === 5 ? "space-y-2 sm:col-span-2" : "space-y-2"}>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-9 w-full" />
                </div>
            ))}
        </div>
    </div>
);

interface EditTaskFormWrapperProps {
    onCancel: () => void;
    id: string;
}

export const EditTaskFormWrapper = ({
    onCancel,
    id,
}: EditTaskFormWrapperProps) => {
    const workspaceId = useWorkspaceId()

    const { data: initialValues, isLoading: isLoadingTask } = useGetTask({
        taskId: id
    })

    const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId })
    const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId })

    const projectOptions = projects?.documents.map((project) => ({
        id: project.$id,
        name: project.name,
        imageUrl: project.imageUrl,
    }))

    const memberOptions = members?.documents.map((member) => ({
        id: member.$id,
        name: member.name,
    }))

    const isLoading = isLoadingProjects || isLoadingMembers || isLoadingTask

    if (isLoading) {
        return <TaskFormSkeleton />
    }

    if (!initialValues) {
        return null
    }

    return (
        <EditTaskForm
            onCancel={onCancel}
            initialValues={initialValues}
            projectOptions={projectOptions ?? []}
            memberOptions={memberOptions ?? []}
        />
    )
}
