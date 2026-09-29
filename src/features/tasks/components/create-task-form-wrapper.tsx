"use client"

import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { CreateTaskForm } from "./create-task-form";
import { TaskFormSkeleton } from "./edit-task-form-wrapper";

interface CreateTaskFormWrapperProps {
    onCancel: () => void;
}

export const CreateTaskFormWrapper = ({
    onCancel
}: CreateTaskFormWrapperProps) => {
    const workspaceId = useWorkspaceId()

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

    const isLoading = isLoadingProjects || isLoadingMembers

    if (isLoading) {
        return <TaskFormSkeleton />
    }

    return (
        <CreateTaskForm
            onCancel={onCancel}
            projectOptions={projectOptions ?? []}
            memberOptions={memberOptions ?? []}
        />
    )
}
