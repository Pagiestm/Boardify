"use client";

import { Column, ColumnDef } from "@tanstack/react-table";
import { ArrowDownIcon, ArrowUpDownIcon, ArrowUpIcon, MoreHorizontalIcon } from "lucide-react";

import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { TaskDate } from "./task-date";
import { TaskActions } from "./task-actions";
import type { TaskTableFeatures } from "./task-table-features";

import { PopulatedTask, TaskStatus } from "../types";
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "../constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TaskColumn = Column<TaskTableFeatures, PopulatedTask, any>;

const SortableHeader = ({ column, label }: { column: TaskColumn; label: string }) => {
  const sorted = column.getIsSorted();
  const Icon = sorted === "asc" ? ArrowUpIcon : sorted === "desc" ? ArrowDownIcon : ArrowUpDownIcon;

  return (
    <Button
      variant="ghost"
      size="xs"
      className={cn("-ml-2 font-medium", sorted ? "text-foreground" : "text-muted-foreground")}
      onClick={() => column.toggleSorting(sorted === "asc")}
    >
      {label}
      <Icon className={cn("size-3.5", !sorted && "opacity-50")} />
    </Button>
  );
};

const Empty = () => <span className="text-muted-foreground">-</span>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const columns: ColumnDef<TaskTableFeatures, PopulatedTask, any>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => <SortableHeader column={column} label="Tâche" />,
    cell: ({ row }) => (
      <p
        className={cn(
          "line-clamp-1 max-w-[320px] font-medium",
          row.original.status === TaskStatus.DONE && "text-muted-foreground line-through",
        )}
      >
        {row.original.name}
      </p>
    ),
  },
  {
    id: "project",
    accessorFn: (row) => row.project?.name ?? "",
    header: ({ column }) => <SortableHeader column={column} label="Projet" />,
    cell: ({ row }) => {
      const project = row.original.project;
      if (!project) return <Empty />;

      return (
        <div className="flex items-center gap-2">
          <ProjectAvatar name={project.name} image={project.imageUrl} className="size-5" />
          <span className="line-clamp-1">{project.name}</span>
        </div>
      );
    },
  },
  {
    id: "assignee",
    accessorFn: (row) => row.assignee?.name ?? "",
    header: ({ column }) => <SortableHeader column={column} label="Assigné à" />,
    cell: ({ row }) => {
      const name = row.original.assignee?.name;
      if (!name) return <Empty />;

      return (
        <div className="flex items-center gap-2">
          <MemberAvatar name={name} className="size-6" fallbackClassName="text-[10px]" />
          <span className="line-clamp-1">{name}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "dueDate",
    header: ({ column }) => <SortableHeader column={column} label="Échéance" />,
    cell: ({ row }) => (
      <TaskDate value={row.original.dueDate} muted={row.original.status === TaskStatus.DONE} />
    ),
  },
  {
    accessorKey: "priority",
    header: ({ column }) => <SortableHeader column={column} label="Priorité" />,
    cell: ({ row }) => {
      const priority = row.original.priority;
      if (!priority || !TASK_PRIORITY_CONFIG[priority]) return <Empty />;

      return (
        <Badge variant={priority} dot>
          {TASK_PRIORITY_CONFIG[priority].label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <SortableHeader column={column} label="Statut" />,
    cell: ({ row }) => {
      const status = row.original.status;
      if (!TASK_STATUS_CONFIG[status]) return <Empty />;

      return (
        <Badge variant={status} dot>
          {TASK_STATUS_CONFIG[status].label}
        </Badge>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <TaskActions id={row.original.$id} projectId={row.original.projectId}>
        <Button
          variant="ghost"
          size="icon-sm"
          className="size-8 text-muted-foreground"
          aria-label="Actions de la tâche"
        >
          <MoreHorizontalIcon />
        </Button>
      </TaskActions>
    ),
  },
];
