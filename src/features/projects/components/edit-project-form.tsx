"use client"

import { z } from "zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useConfirm } from "@/hooks/use-confirm";
import { ImageUploadField } from "@/components/forms/image-upload-field";
import { DangerZone, FormFooter, FormHeader } from "@/components/forms/form-shell";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { Project } from "../types";
import { updateProjectSchema } from "../schemas";
import { useUpdateProject } from "../api/use-update-project";
import { useDeleteProject } from "../api/use-delete-project";

interface EditProjectFormProps {
    onCancel?: () => void;
    initialValues: Project;
}

export const EditProjectForm = ({ onCancel, initialValues }: EditProjectFormProps) => {
    const router = useRouter()
    const { mutate, isPending } = useUpdateProject()
    const {
        mutate: deleteProject,
        isPending: isDeletingProject
    } = useDeleteProject()

    const [DeleteDialog, confirmDelete] = useConfirm(
        "Supprimer le projet",
        "Cette action est irréversible : toutes les tâches du projet seront supprimées.",
        "destructive"
    )

    const form = useForm<z.input<typeof updateProjectSchema>, unknown, z.output<typeof updateProjectSchema>>({
        resolver: zodResolver(updateProjectSchema),
        defaultValues: {
            ...initialValues,
            image: initialValues.imageUrl ?? "",
        },
    })

    const handleDelete = async () => {
        const ok = await confirmDelete()

        if (!ok) return

        deleteProject({
            param: { projectId: initialValues.$id }
        }, {
            onSuccess: () => {
                window.location.href = `/workspaces/${initialValues.workspaceId}`
            }
        })
    }

    const onSubmit = (values: z.output<typeof updateProjectSchema>) => {
        const finalValues = {
            ...values,
            image: values.image instanceof File ? values.image : ""
        }

        mutate({
            form: finalValues,
            param: { projectId: initialValues.$id }
        })
    }

    const handleBack = onCancel ?? (() => router.push(`/workspaces/${initialValues.workspaceId}/projects/${initialValues.$id}`))

    return (
        <div className="flex flex-col gap-6">
            <DeleteDialog />
            <Card className="overflow-hidden">
                <FormHeader
                    onBack={handleBack}
                    title="Paramètres du projet"
                    description={<>Modifiez le nom et l&apos;icône de <strong className="font-medium text-foreground">{initialValues.name}</strong>.</>}
                />
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="flex flex-col gap-5 px-6 pb-6">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nom du projet</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Ex. : Refonte du site"
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="image"
                                render={({ field }) => (
                                    <ImageUploadField
                                        label="Icône du projet"
                                        value={field.value}
                                        onChange={field.onChange}
                                        disabled={isPending}
                                    />
                                )}
                            />
                        </div>
                        <FormFooter
                            onCancel={onCancel}
                            isPending={isPending}
                            submitLabel="Enregistrer"
                        />
                    </form>
                </Form>
            </Card>

            <DangerZone
                description="La suppression d'un projet est irréversible et supprime toutes les tâches associées."
                actionLabel="Supprimer le projet"
                onAction={handleDelete}
                disabled={isPending || isDeletingProject}
            />
        </div>
    )
}
