"use client";

import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { FlagIcon, ListChecksIcon, SignalIcon, Trash2Icon, UserIcon, XIcon } from "lucide-react";

import { NO_SPRINT } from "@/features/sprints/types";
import { useGetSprints } from "@/features/sprints/api/use-sprints";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { COLUMN_COLOR_CONFIG } from "@/features/projects/constants";
import { useWorkspaceColumns } from "@/features/projects/hooks/use-workspace-columns";

import { cn } from "@/lib/utils";
import { client } from "@/lib/rpc";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PopulatedTask, TaskPriority } from "../types";
import { TASK_PRIORITY_CONFIG } from "../constants";
import { useDeleteTaskWithUndo } from "../api/use-delete-task";

type BulkChange = Partial<{
  status: string;
  assigneeId: string;
  priority: TaskPriority;
  sprintId: string | null;
}>;

const CONCURRENCY = 4;

/** Applique la même modification à plusieurs tâches, par petits lots. */
const useBulkChange = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ tasks, change }: { tasks: PopulatedTask[]; change: BulkChange }) => {
      let updated = 0;
      for (let index = 0; index < tasks.length; index += CONCURRENCY) {
        const batch = tasks.slice(index, index + CONCURRENCY);
        const results = await Promise.all(
          batch.map((task) =>
            client.api.tasks[":taskId"]
              .$patch({ param: { taskId: task.$id }, json: change })
              .then((response) => response.ok)
              .catch(() => false),
          ),
        );
        updated += results.filter(Boolean).length;
      }
      return { updated, total: tasks.length };
    },
    onSuccess: ({ updated, total }) => {
      if (updated === total) {
        toast.success(
          `${updated} tâche${updated > 1 ? "s" : ""} mise${updated > 1 ? "s" : ""} à jour`,
        );
      } else {
        toast.error(
          `${total - updated} tâche${total - updated > 1 ? "s" : ""} non mise${total - updated > 1 ? "s" : ""} à jour`,
        );
      }
      for (const queryKey of [
        ["tasks"],
        ["task"],
        ["activities"],
        ["sprints"],
        ["project-analytics"],
        ["workspace-analytics"],
      ]) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
  });
};

interface BulkActionsBarProps {
  workspaceId: string;
  tasks: PopulatedTask[];
  onClear: () => void;
}

/** Barre d'actions sur les tâches sélectionnées dans le tableau. */
export const BulkActionsBar = ({ workspaceId, tasks, onClear }: BulkActionsBarProps) => {
  const { data: members } = useGetMembers({ workspaceId });
  const workspaceColumns = useWorkspaceColumns(workspaceId);
  const { mutate, isPending } = useBulkChange();
  const deleteTasks = useDeleteTaskWithUndo();

  // Statut et sprint dépendent du projet : proposés seulement si toutes les tâches en partagent un.
  const projectIds = new Set(tasks.map((task) => task.projectId));
  const projectId = projectIds.size === 1 ? [...projectIds][0] : null;
  const columns = workspaceColumns.find((entry) => entry.projectId === projectId)?.columns;
  const { data: sprints } = useGetSprints({ projectId, enabled: Boolean(projectId) });
  const openSprints = sprints?.filter((sprint) => !sprint.completed) ?? [];

  const apply = (change: BulkChange) => mutate({ tasks, change }, { onSuccess: onClear });
  const count = tasks.length;
  const trigger =
    "h-8 w-auto min-w-36 bg-background text-[13px] [&>svg:first-child]:text-muted-foreground";

  return (
    <div
      role="region"
      aria-label="Actions sur la sélection"
      className="flex flex-wrap items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2"
    >
      <span className="mr-1 flex items-center gap-2 text-sm font-medium">
        {isPending && <Spinner />}
        {count} tâche{count > 1 ? "s" : ""} sélectionnée{count > 1 ? "s" : ""}
      </span>

      {columns && (
        <Select value="" onValueChange={(status) => apply({ status })} disabled={isPending}>
          <SelectTrigger className={trigger} aria-label="Changer le statut">
            <ListChecksIcon />
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            {columns.map((column) => (
              <SelectItem key={column.id} value={column.id}>
                <span
                  aria-hidden
                  className={cn("size-2 rounded-full", COLUMN_COLOR_CONFIG[column.color].dot)}
                />
                {column.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Select value="" onValueChange={(assigneeId) => apply({ assigneeId })} disabled={isPending}>
        <SelectTrigger className={trigger} aria-label="Changer l'assigné">
          <UserIcon />
          <SelectValue placeholder="Assigné à" />
        </SelectTrigger>
        <SelectContent>
          {members?.documents.map((member) => (
            <SelectItem key={member.$id} value={member.$id}>
              <MemberAvatar name={member.name} image={member.avatarUrl} className="size-5" />
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value=""
        onValueChange={(priority) => apply({ priority: priority as TaskPriority })}
        disabled={isPending}
      >
        <SelectTrigger className={trigger} aria-label="Changer la priorité">
          <SignalIcon />
          <SelectValue placeholder="Priorité" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(TaskPriority).map((priority) => (
            <SelectItem key={priority} value={priority}>
              <span
                aria-hidden
                className={cn("size-2 rounded-full", TASK_PRIORITY_CONFIG[priority].dot)}
              />
              {TASK_PRIORITY_CONFIG[priority].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {projectId && (
        <Select
          value=""
          onValueChange={(sprintId) =>
            apply({ sprintId: sprintId === NO_SPRINT ? null : sprintId })
          }
          disabled={isPending}
        >
          <SelectTrigger className={trigger} aria-label="Changer le sprint">
            <FlagIcon />
            <SelectValue placeholder="Sprint" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={NO_SPRINT}>Sans sprint</SelectItem>
            {openSprints.map((sprint) => (
              <SelectItem key={sprint.$id} value={sprint.$id}>
                {sprint.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <Button
        size="sm"
        variant="ghost"
        disabled={isPending}
        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
        onClick={() => {
          deleteTasks(tasks);
          onClear();
        }}
      >
        <Trash2Icon />
        Supprimer
      </Button>

      <Button
        size="icon-sm"
        variant="ghost"
        onClick={onClear}
        aria-label="Désélectionner"
        className="ml-auto"
      >
        <XIcon />
      </Button>
    </div>
  );
};
