"use client";

import { useGetProject } from "@/features/projects/api/use-get-project";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { EditProjectForm } from "@/features/projects/components/edit-project-form";

import { PageLoader } from "@/components/page-loader";
import { PageError } from "@/components/page-error";

export const ProjectIdSettingsClient = () => {
    const projectId = useProjectId()
    const { data: initialValues, isLoading } = useGetProject({ projectId })

    if (isLoading) {
        return <PageLoader />
    }

    if (!initialValues) {
        return <PageError message="Projet non trouvé" />
    }

    return (
        <div className="w-full max-w-2xl">
            <EditProjectForm initialValues={initialValues} />
        </div>
    )
}