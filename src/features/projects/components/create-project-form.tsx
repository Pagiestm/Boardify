"use client"

import { z } from "zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Input } from "@/components/ui/input";
import { ImageUploadField } from "@/components/forms/image-upload-field";
import { FormFooter, FormHeader } from "@/components/forms/form-shell";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { projectFormSchema } from "../schemas";
import { useCreateProject } from "../api/use-create-project";

interface CreateProjectFormProps {
    onCancel?: () => void;
}

export const CreateProjectForm = ({ onCancel }: CreateProjectFormProps) => {
    const workspaceId = useWorkspaceId()
    const router = useRouter()
    const { mutate, isPending } = useCreateProject()

    const form = useForm<z.input<typeof projectFormSchema>, unknown, z.output<typeof projectFormSchema>>({
        resolver: zodResolver(projectFormSchema),
        defaultValues: {
            name: "",
        },
    })

    const onSubmit = (values: z.output<typeof projectFormSchema>) => {
        const finalValues = {
            ...values,
            workspaceId,
            image: values.image instanceof File ? values.image : ""
        }

        mutate({ form: finalValues }, {
            onSuccess: ({ data }) => {
                form.reset()
                router.push(`/workspaces/${workspaceId}/projects/${data.$id}`)
            }
        })
    }

    return (
        <div className="w-full">
            <FormHeader
                title="Créer un projet"
                description="Regroupez les tâches liées à un même objectif."
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
                                            autoFocus
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
                        submitLabel="Créer"
                    />
                </form>
            </Form>
        </div>
    )
}
