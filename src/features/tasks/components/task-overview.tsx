import { useEffect } from "react";
import { FaGithub } from "react-icons/fa";
import Link from "next/link";
import { CheckIcon, FlagIcon, LockIcon, PencilIcon, RepeatIcon } from "lucide-react";

import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useGetSprints } from "@/features/sprints/api/use-sprints";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { TaskDate } from "./task-date";
import { LabelBadge } from "@/features/labels/components/label-badge";

import { OverviewProperty } from "./overview-property";
import { TaskStatusBadge } from "./task-status-badge";

import { PopulatedTask } from "../types";
import { isTaskDone } from "../utils";
import { TASK_PRIORITY_CONFIG, TASK_RECURRENCE_LABELS } from "../constants";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";
import { isTypingTarget } from "./task-view-switcher";

interface DependencyState {
  $id: string;
  name: string;
  done: boolean;
}

interface TaskOverviewProps {
  task: PopulatedTask & { blockers?: DependencyState[]; blocking?: DependencyState[] };
}

const Empty = () => <span className="text-muted-foreground">-</span>;

const DependencyList = ({
  workspaceId,
  tasks,
}: {
  workspaceId: string;
  tasks: DependencyState[];
}) => (
  <ul className="flex min-w-0 flex-col gap-1">
    {tasks.map((dependency) => (
      <li key={dependency.$id} className="flex min-w-0 items-center gap-1.5">
        {dependency.done ? (
          <CheckIcon className="size-3.5 shrink-0 text-primary" />
        ) : (
          <LockIcon className="size-3.5 shrink-0 text-amber-500" />
        )}
        <Link
          href={`/workspaces/${workspaceId}/tasks/${dependency.$id}`}
          className={cn(
            "truncate hover:underline",
            dependency.done && "text-muted-foreground line-through",
          )}
        >
          {dependency.name}
        </Link>
      </li>
    ))}
  </ul>
);

export const TaskOverview = ({ task }: TaskOverviewProps) => {
  const { open } = useEditTaskModal();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "e" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target)
      )
        return;
      if (document.querySelector("[role=dialog]")) return;
      event.preventDefault();
      open(task.$id);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, task.$id]);

  const priority = task.priority ? TASK_PRIORITY_CONFIG[task.priority] : undefined;
  const { data: sprints } = useGetSprints({
    projectId: task.projectId,
    enabled: Boolean(task.sprintId),
  });
  const sprint = sprints?.find((entry) => entry.$id === task.sprintId);

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-2 border-b py-3">
        <CardTitle className="text-sm">Détails</CardTitle>
        <Button onClick={() => open(task.$id)} size="sm" variant="outline" title="Modifier (e)">
          <PencilIcon />
          Modifier
        </Button>
      </CardHeader>
      <CardContent className="py-2">
        <dl className="divide-y">
          <OverviewProperty label="Assigné à">
            {task.assignee?.name ? (
              <>
                <MemberAvatar
                  name={task.assignee.name}
                  className="size-6"
                  fallbackClassName="text-[10px]"
                />
                <span className="truncate">{task.assignee.name}</span>
              </>
            ) : (
              <Empty />
            )}
          </OverviewProperty>
          <OverviewProperty label="Échéance">
            <TaskDate value={task.dueDate} variant="full" showIcon muted={isTaskDone(task)} />
          </OverviewProperty>
          <OverviewProperty label="Statut">
            <TaskStatusBadge status={task.status} column={task.statusColumn} />
          </OverviewProperty>
          <OverviewProperty label="Priorité">
            {priority && task.priority ? (
              <Badge variant={task.priority} dot>
                {priority.label}
              </Badge>
            ) : (
              <Empty />
            )}
          </OverviewProperty>
          <OverviewProperty label="Projet">
            {task.project ? (
              <>
                <ProjectAvatar
                  name={task.project.name}
                  image={task.project.imageUrl}
                  className="size-5"
                />
                <span className="truncate">{task.project.name}</span>
              </>
            ) : (
              <Empty />
            )}
          </OverviewProperty>
          <OverviewProperty label="Étiquettes">
            {task.labels && task.labels.length > 0 ? (
              <span className="flex flex-wrap gap-1">
                {task.labels.map((label) => (
                  <LabelBadge key={label.$id} label={label} />
                ))}
              </span>
            ) : (
              <Empty />
            )}
          </OverviewProperty>
          {sprint && (
            <OverviewProperty label="Sprint">
              <FlagIcon className="size-4 shrink-0 text-muted-foreground" />
              <Link
                href={`/workspaces/${task.workspaceId}/projects/${task.projectId}?sprintId=${sprint.$id}`}
                className="truncate hover:underline"
              >
                {sprint.name}
              </Link>
            </OverviewProperty>
          )}
          {task.estimate != null && (
            <OverviewProperty label="Estimation">
              <span className="tabular-nums">
                {task.estimate} point{task.estimate > 1 ? "s" : ""}
              </span>
            </OverviewProperty>
          )}
          {task.recurrence && (
            <OverviewProperty label="Répétition">
              <RepeatIcon className="size-4 shrink-0 text-muted-foreground" />
              <span className="truncate">{TASK_RECURRENCE_LABELS[task.recurrence]}</span>
            </OverviewProperty>
          )}
          {!!task.blockers?.length && (
            <OverviewProperty label="Bloquée par">
              <DependencyList workspaceId={task.workspaceId} tasks={task.blockers} />
            </OverviewProperty>
          )}
          {!!task.blocking?.length && (
            <OverviewProperty label="Bloque">
              <DependencyList workspaceId={task.workspaceId} tasks={task.blocking} />
            </OverviewProperty>
          )}
          {task.githubIssueUrl && (
            <OverviewProperty label="GitHub">
              <a
                href={task.githubIssueUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-w-0 items-center gap-x-2 hover:underline"
              >
                <FaGithub className="size-4 shrink-0" />
                <span className="truncate">Issue #{task.githubIssueUrl.split("/").pop()}</span>
              </a>
            </OverviewProperty>
          )}
        </dl>
      </CardContent>
    </Card>
  );
};
