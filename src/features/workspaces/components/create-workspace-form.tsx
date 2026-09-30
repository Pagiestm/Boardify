"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";

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

import { createWorkspaceSchema } from "../schemas";
import { useCreateWorkspace } from "../api/use-create-workspace";

interface CreateWorkspaceFormProps {
  onCancel?: () => void;
}

export const CreateWorkspaceForm = ({ onCancel }: CreateWorkspaceFormProps) => {
  const router = useRouter();
  const { mutate, isPending } = useCreateWorkspace();

  const form = useForm<
    z.input<typeof createWorkspaceSchema>,
    unknown,
    z.output<typeof createWorkspaceSchema>
  >({
    resolver: zodResolver(createWorkspaceSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (values: z.output<typeof createWorkspaceSchema>) => {
    const finalValues = {
      ...values,
      image: values.image instanceof File ? values.image : "",
    };

    mutate(
      { form: finalValues },
      {
        onSuccess: ({ data }) => {
          form.reset();
          router.push(`/workspaces/${data.$id}`);
        },
      },
    );
  };

  return (
    <div className="w-full">
      <FormHeader
        title="Créer un espace de travail"
        description="Un espace réunit votre équipe, ses projets et ses tâches."
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
                    <Input {...field} autoFocus placeholder="Ex. : Équipe produit" />
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
          <FormFooter onCancel={onCancel} isPending={isPending} submitLabel="Créer" />
        </form>
      </Form>
    </div>
  );
};
