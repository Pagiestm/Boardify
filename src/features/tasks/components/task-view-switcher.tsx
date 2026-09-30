"use client";

import { useCallback, useEffect } from "react";
import { useQueryState } from "nuqs";
import { CalendarDaysIcon, KanbanIcon, PlusIcon, TableIcon } from "lucide-react";

import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Kbd } from "@/components/ui/kbd";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { DataFilters } from "./data-filters";

import { columns } from "./columns";
import { DataTable } from "./data-table";
import { DataKanban } from "./data-kanban";
import { DataCalendar } from "./data-calendar";

import { TaskStatus } from "../types";
import { useGetTasks } from "../api/use-get-tasks";
import { useTaskFilters } from "../hooks/use-task-filters";
import { useCreateTaskModal } from "../hooks/use-create-task-modal";
import { useBulkUpdateTasks } from "../api/use-bulk-update-tasks";

interface TaskViewSwitcherProps {
  hideProjectFilter?: boolean;
}

const views = [
  { value: "table", key: "1", label: "Tableau", icon: TableIcon },
  { value: "kanban", key: "2", label: "Kanban", icon: KanbanIcon },
  { value: "calendar", key: "3", label: "Calendrier", icon: CalendarDaysIcon },
] as const;

const TasksSkeleton = ({ view }: { view: string }) => {
  if (view === "kanban") {
    return (
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="flex w-[272px] min-w-[272px] flex-col gap-2 rounded-lg bg-muted/40 p-2"
          >
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (view === "calendar") {
    return <Skeleton className="h-[520px] w-full" />;
  }

  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-9 w-full max-w-xs" />
      <div className="overflow-hidden rounded-lg border">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 border-b px-3 py-3 last:border-0">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="h-4 w-1/6" />
            <Skeleton className="ml-auto h-5 w-16" />
          </div>
        ))}
      </div>
    </div>
  );
};

export const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false;
  return (
    target.isContentEditable ||
    ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName) ||
    target.getAttribute("role") === "combobox"
  );
};

export const TaskViewSwitcher = ({ hideProjectFilter }: TaskViewSwitcherProps) => {
  const [{ status, assigneeId, projectId, dueDate }] = useTaskFilters();

  const [view, setView] = useQueryState("task-view", {
    defaultValue: "table",
  });

  const workspaceId = useWorkspaceId();
  const paramProjectId = useProjectId();
  const { open } = useCreateTaskModal();

  const { mutate: bulkUpdate } = useBulkUpdateTasks();

  const { data: tasks, isLoading: isLoadingTasks } = useGetTasks({
    workspaceId,
    projectId: paramProjectId || projectId,
    assigneeId,
    status,
    dueDate,
  });

  // 1 / 2 / 3 switch views (ignored while typing or with modifiers)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) return;
      if (document.querySelector("[role=dialog]")) return;
      const match = views.find((v) => v.key === event.key);
      if (match) {
        event.preventDefault();
        setView(match.value);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [setView]);

  const onKanbanChange = useCallback(
    (tasks: { $id: string; status: TaskStatus; position: number }[]) => {
      bulkUpdate({
        json: { tasks },
      });
    },
    [bulkUpdate],
  );

  return (
    <Tabs
      value={view}
      onValueChange={setView}
      className="w-full flex-1 rounded-lg border bg-card shadow-xs"
    >
      <div className="flex flex-col gap-3 border-b p-4 lg:flex-row lg:items-center lg:justify-between">
        <TabsList className="w-full lg:w-auto">
          {views.map(({ value, key, label, icon: Icon }) => (
            <TabsTrigger
              key={value}
              value={value}
              title={`${label} (${key})`}
              className="flex-1 lg:flex-none"
            >
              <Icon />
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        <Button onClick={open} size="sm" className="w-full lg:w-auto">
          <PlusIcon />
          Nouvelle tâche
          <Kbd className="ml-1 hidden border-primary-foreground/30 bg-primary-foreground/10 text-primary-foreground lg:inline-flex">
            N
          </Kbd>
        </Button>
      </div>
      <div className="border-b px-4 py-3">
        <DataFilters hideProjectFilter={hideProjectFilter} />
      </div>
      <div className="p-4">
        {isLoadingTasks ? (
          <TasksSkeleton view={view} />
        ) : (
          <>
            <TabsContent value="table" className="mt-0">
              <DataTable columns={columns} data={tasks?.documents ?? []} />
            </TabsContent>
            <TabsContent value="kanban" className="mt-0">
              <DataKanban onChange={onKanbanChange} data={tasks?.documents ?? []} />
            </TabsContent>
            <TabsContent value="calendar" className="mt-0 h-full">
              <DataCalendar data={tasks?.documents ?? []} />
            </TabsContent>
          </>
        )}
      </div>
    </Tabs>
  );
};
