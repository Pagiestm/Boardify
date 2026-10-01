import { useEffect } from "react";
import { PencilIcon } from "lucide-react";

import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { TaskDate } from "./task-date";
import { LabelBadge } from "@/features/labels/components/label-badge";

import { OverviewProperty } from "./overview-property";

import { PopulatedTask, TaskStatus } from "../types";
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "../constants";
import { useEditTaskModal } from "../hooks/use-edit-task-modal";
import { isTypingTarget } from "./task-view-switcher";

interface TaskOverviewProps {
  task: PopulatedTask;
}

const Empty = () => <span className="text-muted-foreground">-</span>;

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

  const status = TASK_STATUS_CONFIG[task.status];
  const priority = task.priority ? TASK_PRIORITY_CONFIG[task.priority] : undefined;

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
            <TaskDate
              value={task.dueDate}
              variant="full"
              showIcon
              muted={task.status === TaskStatus.DONE}
            />
          </OverviewProperty>
          <OverviewProperty label="Statut">
            {status ? (
              <Badge variant={task.status} dot>
                {status.label}
              </Badge>
            ) : (
              <Empty />
            )}
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
        </dl>
      </CardContent>
    </Card>
  );
};
