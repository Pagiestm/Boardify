"use client";

import { useGetTask } from "@/features/tasks/api/use-get-task";
import { useTaskId } from "@/features/tasks/hooks/use-task-id";
import { TaskOverview } from "@/features/tasks/components/task-overview";
import { TaskBreadcrumbs } from "@/features/tasks/components/task-breadcrumbs";
import { TaskDescription } from "@/features/tasks/components/task-description";

import { Skeleton } from "@/components/ui/skeleton";
import { PageError } from "@/components/page-error";

const TaskSkeleton = () => (
  <div className="flex flex-col gap-4">
    <div className="flex items-center gap-3">
      <Skeleton className="h-5 w-64" />
      <Skeleton className="ml-auto h-8 w-28" />
    </div>
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
      <Skeleton className="h-64 w-full rounded-lg" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  </div>
);

export const TaskIdClient = () => {
  const taskId = useTaskId();
  const { data, isLoading } = useGetTask({ taskId });

  if (isLoading) {
    return <TaskSkeleton />;
  }

  if (!data) {
    return <PageError message="Tâche introuvable" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <TaskBreadcrumbs project={data.project} task={data} />
      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <TaskDescription key={data.$updatedAt} task={data} />
        <TaskOverview task={data} />
      </div>
    </div>
  );
};
