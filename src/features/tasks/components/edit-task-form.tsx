"use client";

import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { Form } from "@/components/ui/form";
import { FormFooter, FormHeader } from "@/components/forms/form-shell";

import { Task } from "../types";
import { taskFormSchema } from "../schemas";
import { useUpdateTask } from "../api/use-update-task";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { parseBoardColumns } from "@/features/projects/utils";
import { useWorkspaceColumns } from "@/features/projects/hooks/use-workspace-columns";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

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
  const workspaceId = useWorkspaceId();
  const paramProjectId = useProjectId();
  const { data: project } = useGetProject({
    projectId: paramProjectId,
    enabled: Boolean(paramProjectId),
  });

  const form = useForm<z.input<typeof taskFormSchema>, unknown, z.output<typeof taskFormSchema>>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      ...initialValues,
      dueDate: initialValues.dueDate ? new Date(initialValues.dueDate) : undefined,
    },
  });

  const selectedProjectId = useWatch({ control: form.control, name: "projectId" });
  const workspaceColumns = useWorkspaceColumns(workspaceId);

  const boardColumns = paramProjectId
    ? parseBoardColumns(project?.columnConfig).filter((column) => !column.hidden)
    : workspaceColumns.find((entry) => entry.projectId === selectedProjectId)?.columns;

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
            boardColumns={boardColumns}
            hideProjectField={Boolean(paramProjectId)}
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
