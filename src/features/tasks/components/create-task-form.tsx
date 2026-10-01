"use client";

import { useEffect } from "react";

import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Form } from "@/components/ui/form";
import { FormFooter, FormHeader } from "@/components/forms/form-shell";

import { taskFormSchema } from "../schemas";
import { useCreateTask } from "../api/use-create-task";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { parseBoardColumns } from "@/features/projects/utils";
import { useWorkspaceColumns } from "@/features/projects/hooks/use-workspace-columns";
import { useProjectId } from "@/features/projects/hooks/use-project-id";

import { useCreateTaskModal } from "../hooks/use-create-task-modal";
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
  const { columnId } = useCreateTaskModal();
  const paramProjectId = useProjectId();
  const { data: project } = useGetProject({
    projectId: paramProjectId,
    enabled: Boolean(paramProjectId),
  });

  const form = useForm<z.input<typeof taskFormSchema>, unknown, z.output<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      name: "",
      ...(paramProjectId ? { projectId: paramProjectId } : {}),
      ...(columnId ? { status: columnId } : {}),
    },
  });

  const selectedProjectId = useWatch({ control: form.control, name: "projectId" });
  const workspaceColumns = useWorkspaceColumns(workspaceId);

  const boardColumns = paramProjectId
    ? parseBoardColumns(project?.columnConfig).filter((column) => !column.hidden)
    : workspaceColumns.find((entry) => entry.projectId === selectedProjectId)?.columns;
  const targetColumn = columnId
    ? boardColumns?.find((column) => column.id === columnId)
    : undefined;

  useEffect(() => {
    if (!targetColumn) return;

    form.setValue("status", targetColumn.id);
  }, [targetColumn, form]);

  const onSubmit = (values: z.output<typeof taskFormSchema>) => {
    mutate(
      {
        json: {
          ...values,
          workspaceId,
        },
      },
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
            boardColumns={boardColumns}
            hideProjectField={Boolean(paramProjectId)}
            memberOptions={memberOptions}
          />
          <FormFooter onCancel={onCancel} isPending={isPending} submitLabel="Créer" />
        </form>
      </Form>
    </div>
  );
};
