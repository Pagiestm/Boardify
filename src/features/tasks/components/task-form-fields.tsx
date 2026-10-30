"use client";

import { useEffect, useRef } from "react";
import { z } from "zod";
import { Control, useFormContext, useWatch } from "react-hook-form";

import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { BoardColumn } from "@/features/projects/types";
import { COLUMN_COLOR_CONFIG } from "@/features/projects/constants";
import { LabelPicker } from "@/features/labels/components/label-picker";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";
import { useGetSprints } from "@/features/sprints/api/use-sprints";
import { getSprintState, NO_SPRINT, SPRINT_STATE_LABELS } from "@/features/sprints/types";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/date-range-picker";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { TaskPriority, TaskRecurrence } from "../types";
import { TaskDependencyPicker } from "./task-dependency-picker";
import { taskFormSchema } from "../schemas";
import {
  TASK_PRIORITY_CONFIG,
  TASK_RECURRENCE_LABELS,
  TASK_STATUS_CONFIG,
  TASK_STATUS_ORDER,
} from "../constants";

export type TaskFormControl = Control<
  z.input<typeof taskFormSchema>,
  unknown,
  z.output<typeof taskFormSchema>
>;

export interface TaskFormOptions {
  projectOptions: { id: string; name: string; imageUrl: string }[];
  memberOptions: { id: string; name?: string; avatarUrl?: string }[];
}

interface TaskFormFieldsProps extends TaskFormOptions {
  control: TaskFormControl;
  taskId?: string;
  boardColumns?: BoardColumn[];
  hideProjectField?: boolean;
  /** Contenu affiché sous le nom de la tâche (assistant IA). */
  afterName?: React.ReactNode;
}

const PRIORITY_ORDER = [TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW];

const Dot = ({ className }: { className: string }) => (
  <span aria-hidden className={cn("size-2 shrink-0 rounded-full", className)} />
);

export const TaskFormFields = ({
  afterName,
  control,
  projectOptions,
  memberOptions,
  boardColumns,
  hideProjectField,
  taskId,
}: TaskFormFieldsProps) => {
  const workspaceId = useWorkspaceId();
  const { setValue } = useFormContext<z.input<typeof taskFormSchema>>();
  const startDate = useWatch({ control, name: "startDate" });
  const projectId = useWatch({ control, name: "projectId" });
  const sprintId = useWatch({ control, name: "sprintId" });
  const { data: sprints } = useGetSprints({ projectId });
  const sprintOptions = (sprints ?? []).filter(
    (sprint) => !sprint.completed || sprint.$id === sprintId,
  );

  const previousProjectId = useRef(projectId);
  useEffect(() => {
    if (previousProjectId.current && previousProjectId.current !== projectId) {
      setValue("sprintId", null);
    }
    previousProjectId.current = projectId;
  }, [projectId, setValue]);

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
      {afterName && <div className="sm:col-span-2">{afterName}</div>}
      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ""}
                rows={4}
                placeholder="Contexte, étapes, liens utiles…"
              />
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
            <Select value={field.value ?? ""} onValueChange={field.onChange}>
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
                    <MemberAvatar className="size-5" name={member.name} image={member.avatarUrl} />
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
          <FormItem className="sm:col-span-2">
            <FormLabel>Période</FormLabel>
            <FormControl>
              <DateRangePicker
                from={startDate ? new Date(startDate as string) : undefined}
                to={field.value ? new Date(field.value as string) : undefined}
                onChange={(range) => {
                  setValue("startDate", range.from ?? "", { shouldValidate: true });
                  field.onChange(range.to ?? "");
                }}
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
      <FormField
        control={control}
        name="sprintId"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Sprint</FormLabel>
            <Select
              value={field.value ?? NO_SPRINT}
              onValueChange={(value) => field.onChange(value === NO_SPRINT ? null : value)}
              disabled={!projectId}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue>
                    {sprintOptions.find((sprint) => sprint.$id === field.value)?.name ??
                      "Sans sprint"}
                  </SelectValue>
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NO_SPRINT}>Sans sprint</SelectItem>
                {sprintOptions.map((sprint) => (
                  <SelectItem key={sprint.$id} value={sprint.$id}>
                    {sprint.name}
                    <span className="text-xs text-muted-foreground">
                      {SPRINT_STATE_LABELS[getSprintState(sprint)]}
                    </span>
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
        name="estimate"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Estimation (points)</FormLabel>
            <FormControl>
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                max={1000}
                step={1}
                placeholder="Ex. : 3"
                value={field.value ?? ""}
                onChange={(event) =>
                  field.onChange(
                    event.target.value === "" ? null : Math.round(Number(event.target.value)),
                  )
                }
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={control}
        name="recurrence"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Répétition</FormLabel>
            <Select
              value={field.value ?? "none"}
              onValueChange={(value) => field.onChange(value === "none" ? null : value)}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value="none">Jamais</SelectItem>
                {Object.values(TaskRecurrence).map((recurrence) => (
                  <SelectItem key={recurrence} value={recurrence}>
                    {TASK_RECURRENCE_LABELS[recurrence]}
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
        name="blockedBy"
        render={({ field }) => (
          <FormItem className="sm:col-span-2">
            <FormLabel>Bloquée par</FormLabel>
            <FormControl>
              <TaskDependencyPicker
                workspaceId={workspaceId}
                taskId={taskId}
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
