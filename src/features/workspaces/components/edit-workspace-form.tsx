"use client"

import { z } from "zod";
import { useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, CopyIcon, ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DottedSeparator } from "@/components/dotted-separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";

import { Workspace } from "../types";
import { updateWorkspaceSchema } from "../schemas";
import { useUpdateWorkspace } from "../api/use-update-workspace";
import { useDeleteWorkspace } from "../api/use-delete-workspace";
import { useResetInviteCode } from "../api/use-reset-invite-code";

interface EditWorkspaceFormProps {
    onCancel?: () => void;
    initialValues: Workspace;
}

export const EditWorkspaceForm = ({ onCancel, initialValues }: EditWorkspaceFormProps) => {
    const router = useRouter()
    const { mutate, isPending } = useUpdateWorkspace()
    const {
        mutate: deleteWorkspace,
        isPending: isDeletingWorkspace
    } = useDeleteWorkspace()
    const {
        mutate: resetInviteCode,
        isPending: isResettingInviteCode
    } = useResetInviteCode()

    const [DeleteDialog, confirmDelete] = useConfirm(
        "Supprimer l&apos;espace de travail",
        "Cette action ne peut pas être annulée.",
        "destructive"
    )

    const [ResetDialog, confirmReset] = useConfirm(
        "Réinitialiser le lien d&apos;invitation",
        "Cela invalidera le lien d&apos;invitation actuel",
        "destructive"
    )

    const inputRef = useRef<HTMLInputElement>(null)

    const form = useForm<z.infer<typeof updateWorkspaceSchema>>({
        resolver: zodResolver(updateWorkspaceSchema),
        defaultValues: {
            ...initialValues,
            image: initialValues.imageUrl ?? "",
        },
    })

    const handleDelete = async () => {
        const ok = await confirmDelete()

        if (!ok) return

        deleteWorkspace({
            param: { workspaceId: initialValues.$id }
        }, {
            onSuccess: () => {
                window.location.href = "/"
            }
        })
    }

    const handleResetInviteCode = async () => {
        const ok = await confirmReset()

        if (!ok) return

        resetInviteCode({
            param: { workspaceId: initialValues.$id }
        })
    }

    const onSubmit = (values: z.infer<typeof updateWorkspaceSchema>) => {
        const finalValues = {
            ...values,
            image: values.image instanceof File ? values.image : ""
        }

        mutate({
            form: finalValues,
            param: { workspaceId: initialValues.$id }
        })
    }

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]

        if (file) {
            form.setValue("image", file)
        }
    }

    const fullinviteLink = `${window.location.origin}/workspaces/${initialValues.$id}/join/${initialValues.inviteCode}`

    const handleCopyinviteLink = () => {
        navigator.clipboard.writeText(fullinviteLink)
        .then(() => toast.success("Lien d&apos;invitation copié dans le presse-papiers"))
    }

    return (
        <div className="flex flex-col gap-y-4">
            <DeleteDialog />
            <ResetDialog />
            <Card className="w-full h-full border-none shadow-none">
                <CardHeader className="flex flex-row items-center gap-x-4 p-7 space-y-0">
                    <Button size="sm" variant="secondary" onClick={onCancel ? onCancel : () => router.push(`/workspaces/${initialValues.$id}`)}>
                        <ArrowLeftIcon className="size-4 mr-2" />
                        Retour
                    </Button>
                    <CardTitle className="text-xl font-bold">
                        {initialValues.name}
                    </CardTitle>
                </CardHeader>
                <div className="px-7">
                    <DottedSeparator />
                </div>
                <CardContent className="p-7">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)}>
                            <div className="flex flex-col gap-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>
                                                Nom de l&apos;espace de travail
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="Entrez le nom de l&apos;espace de travail"
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
                                        <div className="flex flex-col gap-y-2">
                                            <div className="flex items-center gap-x-5">
                                                {field.value ? (
                                                    <div className="size-[72px] relative rounded-md overflow-hidden">
                                                        <Image
                                                            alt="logo"
                                                            fill
                                                            className="object-cover"
                                                            src={
                                                                field.value instanceof File
                                                                    ? URL.createObjectURL(field.value)
                                                                    : field.value
                                                            }
                                                        />
                                                    </div>
                                                ) : (
                                                    <Avatar className="size-[72px]">
                                                        <AvatarFallback>
                                                            <ImageIcon className="size-36px text-neutral-400" />
                                                        </AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className="flex flex-col">
                                                    <p className="text-sm">Icône de l&apos;espace de travail</p>
                                                    <p className="text-sm text-muted-foreground">
                                                        JPG, PNG, SVG ou JPEG, max 1mb
                                                    </p>
                                                    <input
                                                        className="hidden"
                                                        type="file"
                                                        accept=".jpg, .png, .jpeg, .svg"
                                                        ref={inputRef}
                                                        onChange={handleImageChange}
                                                        disabled={isPending}
                                                    />
                                                    {field.value ? (
                                                        <Button
                                                            type="button"
                                                            disabled={isPending}
                                                            variant="destructive"
                                                            size="xs"
                                                            className="w-fit mt-2"
                                                            onClick={() => {
                                                                field.onChange(null)
                                                                if (inputRef.current) {
                                                                    inputRef.current.value = ""
                                                                }
                                                            }}
                                                        >
                                                            Supprimer l&apos;image
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            type="button"
                                                            disabled={isPending}
                                                            variant="teritary"
                                                            size="xs"
                                                            className="w-fit mt-2"
                                                            onClick={() => inputRef.current?.click()}
                                                        >
                                                            Télécharger une image
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                />
                            </div>
                            <DottedSeparator className="py-7" />
                            <div className="flex items-center justify-between">
                                <Button
                                    type="button"
                                    size="lg"
                                    variant="secondary"
                                    onClick={onCancel}
                                    disabled={isPending}
                                    className={cn(!onCancel && "invisible")}
                                >
                                    Annuler
                                </Button>
                                <Button
                                    disabled={isPending}
                                    type="submit"
                                    size="lg"
                                >
                                    Enregistrer
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>

            <Card className="w-full h-full border-none shadow-none">
                <CardContent className="p-7">
                    <div className="flex flex-col">
                        <h3 className="font-bold">Inviter des membres</h3>
                        <p className="text-sm text-muted-foreground">
                            Utilisez le lien d&apos;invitation pour ajouter des membres à votre espace de travail.
                        </p>
                        <div className="mt-4">
                            <div className="flex items-center gap-x-2">
                                <Input disabled value={fullinviteLink} />
                                <Button
                                    onClick={handleCopyinviteLink}
                                    variant="secondary"
                                    className="size-12"
                                >
                                    <CopyIcon className="size-5"/>
                                </Button>
                            </div>
                        </div>
                        <DottedSeparator className="py-7" />
                        <Button
                            className="mt-6 w-fit ml-auto"
                            size="sm"
                            variant="destructive"
                            type="button"
                            disabled={isPending || isResettingInviteCode}
                            onClick={handleResetInviteCode}
                        >
                            Réinitialiser le lien d&apos;invitation
                        </Button>
                    </div>
                </CardContent>
            </Card>

            <Card className="w-full h-full border-none shadow-none">
                <CardContent className="p-7">
                    <div className="flex flex-col">
                        <h3 className="font-bold">Zone de danger</h3>
                        <p className="text-sm text-muted-foreground">
                            La suppression d&apos;un espace de travail est irréversible et supprimera toutes les données associées.
                        </p>
                        <DottedSeparator className="py-7" />
                        <Button
                            className="mt-6 w-fit ml-auto"
                            size="sm"
                            variant="destructive"
                            type="button"
                            disabled={isPending || isDeletingWorkspace}
                            onClick={handleDelete}
                        >
                            Supprimer l&apos;espace de travail
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}