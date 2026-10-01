"use client";

import { z } from "zod";
import { Control } from "react-hook-form";

import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { BoardColumn } from "@/features/projects/types";
import { COLUMN_COLOR_CONFIG } from "@/features/projects/constants";
import { LabelPicker } from "@/features/labels/components/label-picker";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/date-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TaskPriority } from "../types";
import { taskFormSchema } from "../schemas";
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG, TASK_STATUS_ORDER } from "../constants";

export type TaskFormControl = Control<
  z.input<typeof taskFormSchema>,
  unknown,
  z.output<typeof taskFormSchema>
>;

export interface TaskFormOptions {
  projectOptions: { id: string; name: string; imageUrl: string }[];
  memberOptions: { id: string; name?: string }[];
}

interface TaskFormFieldsProps extends TaskFormOptions {
  control: TaskFormControl;
  boardColumns?: BoardColumn[];
  hideProjectField?: boolean;
}

const PRIORITY_ORDER = [TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW];

const Dot = ({ className }: { className: string }) => (
  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", className)} />
);

export const TaskFormFields = ({
  control,
  projectOptions,
  memberOptions,
  boardColumns,
  hideProjectField,
}: TaskFormFieldsProps) => {
  const workspaceId = useWorkspaceId();

  return (
    <div className="grid gap-5 px-6 pb-6 sm:grid-cols-2">
      <FormField
        control={control}
        name="name"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Nom de la tâche</FormLabel>
            <FormControl>
              <Input {...field} placeholder="Ex. : Préparer la démo client" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {boardColumns ? (
        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select
                value={typeof field.value === "string" ? field.value : undefined}
                onValueChange={field.onChange}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {boardColumns.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      <Dot className={COLUMN_COLOR_CONFIG[column.color].dot} />
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <FormField
          control={control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Statut</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un statut" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {TASK_STATUS_ORDER.map((status) => (
                    <SelectItem key={status} value={status}>
                      <Dot className={TASK_STATUS_CONFIG[status].dot} />
                      {TASK_STATUS_CONFIG[status].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormField
        control={control}
        name="priority"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Priorité</FormLabel>
            <Select defaultValue={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir une priorité" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {PRIORITY_ORDER.map((priority) => (
                  <SelectItem key={priority} value={priority}>
                    <Dot className={TASK_PRIORITY_CONFIG[priority].dot} />
                    {TASK_PRIORITY_CONFIG[priority].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="assigneeId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Assigné à</FormLabel>
            <Select defaultValue={field.value} onValueChange={field.onChange}>
              <FormControl>
                <SelectTrigger>
                  <SelectValue placeholder="Choisir un membre" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {memberOptions.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    <MemberAvatar className="size-5" name={member.name} />
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="dueDate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Date d&apos;échéance</FormLabel>
            <FormControl>
              <DatePicker
                value={field.value ? new Date(field.value) : undefined}
                onChange={(date) => field.onChange(date || "")}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      {hideProjectField ? null : (
        <FormField
          control={control}
          name="projectId"
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Projet</FormLabel>
              <Select defaultValue={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un projet" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {projectOptions.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      <ProjectAvatar
                        className="size-5"
                        name={project.name}
                        image={project.imageUrl}
                      />
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      )}
      <FormField
        control={control}
        name="labelIds"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Étiquettes</FormLabel>
            <FormControl>
              <LabelPicker
                workspaceId={workspaceId}
                value={field.value ?? []}
                onChange={field.onChange}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
};
