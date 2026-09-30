"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";
import { FormFooter, FormHeader } from "@/components/forms/form-shell";

import { Task } from "../types";
import { taskFormSchema } from "../schemas";
import { useUpdateTask } from "../api/use-update-task";
import { TaskFormFields, type TaskFormOptions } from "./task-form-fields";

interface EditTaskFormProps extends TaskFormOptions {
  onCancel?: () => void;
  initialValues: Task;
}

export const EditTaskForm = ({
  onCancel,
  projectOptions,
  memberOptions,
  initialValues,
}: EditTaskFormProps) => {
  const { mutate, isPending } = useUpdateTask();

  const form = useForm<z.input<typeof taskFormSchema>, unknown, z.output<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      ...initialValues,
      dueDate: initialValues.dueDate ? new Date(initialValues.dueDate) : undefined,
    },
  });

  const onSubmit = (values: z.output<typeof taskFormSchema>) => {
    mutate(
      { json: values, param: { taskId: initialValues.$id } },
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
      <FormHeader title="Modifier la tâche" description={initialValues.name} />
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <TaskFormFields
            control={form.control}
            projectOptions={projectOptions}
            memberOptions={memberOptions}
          />
          <FormFooter onCancel={onCancel} isPending={isPending} submitLabel="Enregistrer" />
        </form>
      </Form>
    </div>
  );
};
