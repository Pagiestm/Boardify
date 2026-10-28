import { ListChecksIcon, LockIcon, MoreHorizontalIcon, RepeatIcon } from "lucide-react";

import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

import { TaskDate } from "./task-date";
import { LabelBadge } from "@/features/labels/components/label-badge";

import { TaskActions } from "./task-actions";

import { PopulatedTask } from "../types";
import { isTaskDone } from "../utils";
import { TASK_PRIORITY_CONFIG } from "../constants";

interface KanbanCardProps {
  task: PopulatedTask;
  isDragging?: boolean;
}

export const KanbanCard = ({ task, isDragging }: KanbanCardProps) => {
  const isDone = isTaskDone(task);

  return (
    <div
      className={cn(
        "group/card mb-2 flex flex-col gap-2.5 rounded-md border bg-card p-3 shadow-xs transition-[border-color,box-shadow]",
        "hover:border-foreground/20",
        isDragging && "shadow-md ring-1 ring-primary/30",
      )}
    >
      <div className="flex items-start gap-2">
        <p
          className={cn(
            "line-clamp-2 flex-1 text-sm leading-snug font-medium",
            isDone && "text-muted-foreground line-through",
          )}
        >
          {task.name}
        </p>
        <TaskActions id={task.$id} projectId={task.projectId}>
          <button
            type="button"
            aria-label="Actions de la tâche"
            className="-mt-0.5 -mr-1 rounded p-0.5 text-muted-foreground opacity-0 transition group-hover/card:opacity-100 hover:bg-accent hover:text-foreground focus-visible:opacity-100"
          >
            <MoreHorizontalIcon className="size-4" />
          </button>
        </TaskActions>
      </div>
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {task.labels.map((label) => (
            <LabelBadge key={label.$id} label={label} />
          ))}
        </div>
      )}
      {(!!task.checklist?.total || !!task.openBlockers || task.recurrence) && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {!!task.openBlockers && (
            <span
              className="flex items-center gap-1 text-amber-600 dark:text-amber-500"
              title="Bloquée par une autre tâche"
            >
              <LockIcon className="size-3.5" />
              Bloquée
            </span>
          )}
          {!!task.checklist?.total && (
            <span
              className={cn(
                "flex items-center gap-1 tabular-nums",
                task.checklist.done === task.checklist.total && "text-primary",
              )}
              title="Sous-tâches"
            >
              <ListChecksIcon className="size-3.5" />
              {task.checklist.done}/{task.checklist.total}
            </span>
          )}
          {task.recurrence && (
            <span className="flex items-center gap-1" title="Tâche récurrente">
              <RepeatIcon className="size-3.5" />
            </span>
          )}
        </div>
      )}
      <div className="flex items-center gap-2">
        {task.priority && (
          <Badge variant={task.priority} dot>
            {TASK_PRIORITY_CONFIG[task.priority].label}
          </Badge>
        )}
        <TaskDate
          value={task.dueDate}
          variant="short"
          showIcon
          muted={isDone}
          className="text-xs"
        />
        <MemberAvatar
          name={task.assignee?.name}
          className="ml-auto size-6"
          fallbackClassName="text-[10px]"
        />
      </div>
      {task.project && (
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ProjectAvatar
            name={task.project.name}
            image={task.project.imageUrl}
            className="size-4"
            fallbackClassName="text-[9px]"
          />
          <span className="truncate">{task.project.name}</span>
        </div>
      )}
    </div>
  );
};
