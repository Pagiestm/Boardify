"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Form } from "@/components/ui/form";
import { FormFooter, FormHeader } from "@/components/forms/form-shell";

import { taskFormSchema } from "../schemas";
import { useCreateTask } from "../api/use-create-task";
import { TaskFormFields, type TaskFormOptions } from "./task-form-fields";

interface CreateTaskFormProps extends TaskFormOptions {
  onCancel?: () => void;
}

export const CreateTaskForm = ({
  onCancel,
  projectOptions,
  memberOptions,
}: CreateTaskFormProps) => {
  const workspaceId = useWorkspaceId();
  const { mutate, isPending } = useCreateTask();

  const form = useForm<z.input<typeof taskFormSchema>, unknown, z.output<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
    },
  });

  const onSubmit = (values: z.output<typeof taskFormSchema>) => {
    mutate(
      { json: { ...values, workspaceId } },
      {
        onSuccess: () => {
          form.reset();
          onCancel?.();
        },
      },
    );
  };

  return (
    <div className="w-full">
      <FormHeader
        title="Nouvelle tâche"
        description="Décrivez la tâche, assignez-la et fixez une échéance."
      />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <TaskFormFields
            control={form.control}
            projectOptions={projectOptions}
            memberOptions={memberOptions}
          />
          <FormFooter onCancel={onCancel} isPending={isPending} submitLabel="Créer" />
        </form>
      </Form>
    </div>
  );
};
