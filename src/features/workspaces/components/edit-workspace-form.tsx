"use client";

import { z } from "zod";
import { toast } from "sonner";
import { useState } from "react";
import { CheckIcon, CopyIcon, RefreshCwIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const { mutate, isPending } = useUpdateWorkspace();
  const { mutate: deleteWorkspace, isPending: isDeletingWorkspace } = useDeleteWorkspace();
  const { mutate: resetInviteCode, isPending: isResettingInviteCode } = useResetInviteCode();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Supprimer l'espace de travail",
    "Cette action est irréversible : tous les projets et tâches associés seront supprimés.",
    "destructive",
  );

  const [ResetDialog, confirmReset] = useConfirm(
    "Réinitialiser le lien d'invitation",
    "Le lien actuel ne fonctionnera plus. Vous devrez partager le nouveau lien.",
    "destructive",
  );

  const form = useForm<
    z.input<typeof updateWorkspaceSchema>,
    unknown,
    z.output<typeof updateWorkspaceSchema>
  >({
    resolver: zodResolver(updateWorkspaceSchema),
    defaultValues: {
      ...initialValues,
      image: initialValues.imageUrl ?? "",
    },
  });

  const handleDelete = async () => {
    const ok = await confirmDelete();

    if (!ok) return;

    deleteWorkspace(
      {
        param: { workspaceId: initialValues.$id },
      },
      {
        onSuccess: () => {
          window.location.href = "/dashboard";
        },
      },
    );
  };

  const handleResetInviteCode = async () => {
    const ok = await confirmReset();

    if (!ok) return;

    resetInviteCode({
      param: { workspaceId: initialValues.$id },
    });
  };

  const onSubmit = (values: z.output<typeof updateWorkspaceSchema>) => {
    const finalValues = {
      ...values,
      image: values.image instanceof File ? values.image : "",
    };

    mutate({
      form: finalValues,
      param: { workspaceId: initialValues.$id },
    });
  };

  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const fullInviteLink = `${origin}/workspaces/${initialValues.$id}/join/${initialValues.inviteCode}`;

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(fullInviteLink).then(() => {
      setCopied(true);
      toast.success("Lien d'invitation copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleBack = onCancel ?? (() => router.push(`/workspaces/${initialValues.$id}`));

  return (
    <div className="flex flex-col gap-6">
      <DeleteDialog />
      <ResetDialog />
      <Card className="overflow-hidden">
        <FormHeader
          onBack={handleBack}
          title="Paramètres de l'espace"
          description={
            <>
              Modifiez le nom et l&apos;icône de{" "}
              <strong className="font-medium text-foreground">{initialValues.name}</strong>.
            </>
          }
        />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-5 px-6 pb-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l&apos;espace de travail</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex. : Équipe produit" />
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
                    label="Icône de l'espace de travail"
                    value={field.value}
                    onChange={field.onChange}
                    disabled={isPending}
                  />
                )}
              />
            </div>
            <FormFooter onCancel={onCancel} isPending={isPending} submitLabel="Enregistrer" />
          </form>
        </Form>
      </Card>

      <Card>
        <div className="space-y-4 p-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold">Inviter des membres</h3>
            <p className="text-sm text-muted-foreground">
              Partagez ce lien pour permettre à vos collègues de rejoindre l&apos;espace.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={fullInviteLink}
              onFocus={(e) => e.target.select()}
              className="text-muted-foreground"
              aria-label="Lien d'invitation"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleCopyInviteLink}
              aria-label="Copier le lien"
              className="shrink-0"
            >
              {copied ? <CheckIcon className="text-primary" /> : <CopyIcon />}
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            type="button"
            disabled={isPending || isResettingInviteCode}
            onClick={handleResetInviteCode}
          >
            <RefreshCwIcon />
            Réinitialiser le lien
          </Button>
        </div>
      </Card>

      <DangerZone
        description="La suppression d'un espace de travail est irréversible et supprime toutes les données associées."
        actionLabel="Supprimer l'espace"
        onAction={handleDelete}
        disabled={isPending || isDeletingWorkspace}
      />
    </div>
  );
};
