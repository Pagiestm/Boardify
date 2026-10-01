import { FolderIcon, ListChecksIcon, TagIcon, UserIcon, XIcon } from "lucide-react";

import { useGetMembers } from "@/features/members/api/use-get-members";
import { useGetProjects } from "@/features/projects/api/use-get-projects";
import { useGetLabels } from "@/features/labels/api/use-get-labels";
import { useGetProject } from "@/features/projects/api/use-get-project";
import { useProjectId } from "@/features/projects/hooks/use-project-id";
import { parseBoardColumns } from "@/features/projects/utils";
import { useWorkspaceColumns } from "@/features/projects/hooks/use-workspace-columns";
import { COLUMN_COLOR_CONFIG } from "@/features/projects/constants";
import { LabelBadge } from "@/features/labels/components/label-badge";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { DatePicker } from "@/components/date-picker";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useTaskFilters } from "../hooks/use-task-filters";

interface DataFiltersProps {
  hideProjectFilter?: boolean;
}

const triggerClassName =
  "h-8 w-full text-[13px] lg:w-auto lg:min-w-44 [&>svg:first-child]:text-muted-foreground";
const activeClassName = "border-primary/40 bg-primary/5";

export const DataFilters = ({ hideProjectFilter }: DataFiltersProps) => {
  const workspaceId = useWorkspaceId();
  const paramProjectId = useProjectId();
  const { data: currentProject } = useGetProject({
    projectId: paramProjectId,
    enabled: Boolean(paramProjectId),
  });
  const boardColumns = paramProjectId
    ? parseBoardColumns(currentProject?.columnConfig).filter((column) => !column.hidden)
    : undefined;
  const workspaceColumns = useWorkspaceColumns(workspaceId);

  const { data: projects, isLoading: isLoadingProjects } = useGetProjects({ workspaceId });
  const { data: members, isLoading: isLoadingMembers } = useGetMembers({ workspaceId });
  const { data: labels } = useGetLabels({ workspaceId });

  const isLoading = isLoadingProjects || isLoadingMembers;

  const [{ assigneeId, projectId, dueDate, labelId, status }, setFilters] = useTaskFilters();

  const hasActiveFilters = Boolean(
    assigneeId || dueDate || labelId || status || (!hideProjectFilter && projectId),
  );

  const onAssigneeChange = (value: string) => {
    setFilters({ assigneeId: value === "all" ? null : value });
  };

  const onProjectChange = (value: string) => {
    setFilters({ projectId: value === "all" ? null : value });
  };

  const onStatusChange = (value: string) => {
    setFilters({ status: value === "all" ? null : value });
  };

  const onLabelChange = (value: string) => {
    setFilters({ labelId: value === "all" ? null : value });
  };

  const onReset = () => {
    setFilters({
      assigneeId: null,
      dueDate: null,
      labelId: null,
      status: null,
      ...(hideProjectFilter ? {} : { projectId: null }),
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2 lg:flex-row">
        {Array.from({ length: hideProjectFilter ? 3 : 4 }).map((_, index) => (
          <Skeleton key={index} className="h-8 w-full lg:w-44" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2 lg:flex-row lg:flex-wrap lg:items-center">
      <Select value={status ?? "all"} onValueChange={onStatusChange}>
        <SelectTrigger
          aria-label="Filtrer par statut"
          className={cn(triggerClassName, status && activeClassName)}
        >
          <ListChecksIcon />
          <SelectValue placeholder="Tous les statuts" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les statuts</SelectItem>
          <SelectSeparator />
          {boardColumns
            ? boardColumns.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  <span
                    aria-hidden
                    className={cn("size-2 rounded-full", COLUMN_COLOR_CONFIG[column.color].dot)}
                  />
                  {column.label}
                </SelectItem>
              ))
            : workspaceColumns.map((entry) => (
                <SelectGroup key={entry.projectId}>
                  <SelectLabel>{entry.projectName}</SelectLabel>
                  {entry.columns.map((column) => (
                    <SelectItem key={`${entry.projectId}-${column.id}`} value={column.id}>
                      <span
                        aria-hidden
                        className={cn("size-2 rounded-full", COLUMN_COLOR_CONFIG[column.color].dot)}
                      />
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              ))}
        </SelectContent>
      </Select>
      <Select value={assigneeId ?? "all"} onValueChange={onAssigneeChange}>
        <SelectTrigger
          aria-label="Filtrer par membre"
          className={cn(triggerClassName, assigneeId && activeClassName)}
        >
          <UserIcon />
          <SelectValue placeholder="Tous les membres" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous les membres</SelectItem>
          <SelectSeparator />
          {members?.documents.map((member) => (
            <SelectItem key={member.$id} value={member.$id}>
              <MemberAvatar name={member.name} className="size-5" fallbackClassName="text-[9px]" />
              {member.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {!hideProjectFilter && (
        <Select value={projectId ?? "all"} onValueChange={onProjectChange}>
          <SelectTrigger
            aria-label="Filtrer par projet"
            className={cn(triggerClassName, projectId && activeClassName)}
          >
            <FolderIcon />
            <SelectValue placeholder="Tous les projets" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les projets</SelectItem>
            <SelectSeparator />
            {projects?.documents.map((project) => (
              <SelectItem key={project.$id} value={project.$id}>
                <ProjectAvatar name={project.name} image={project.imageUrl} className="size-5" />
                {project.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      {labels && labels.documents.length > 0 && (
        <Select value={labelId ?? "all"} onValueChange={onLabelChange}>
          <SelectTrigger
            aria-label="Filtrer par étiquette"
            className={cn(triggerClassName, labelId && activeClassName)}
          >
            <TagIcon />
            <SelectValue placeholder="Toutes les étiquettes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Toutes les étiquettes</SelectItem>
            <SelectSeparator />
            {labels.documents.map((label) => (
              <SelectItem key={label.$id} value={label.$id}>
                <LabelBadge label={label} />
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <DatePicker
        placeholder="Échéance"
        className={cn("h-8 w-full text-[13px] lg:w-auto lg:min-w-44", dueDate && activeClassName)}
        value={dueDate ? new Date(dueDate) : undefined}
        onChange={(date) => {
          setFilters({ dueDate: date ? date.toISOString() : null });
        }}
      />
      {hasActiveFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
          <XIcon />
          Réinitialiser
        </Button>
      )}
    </div>
  );
};
