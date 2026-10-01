import { useGetProjects } from "@/features/projects/api/use-get-projects";

import { BoardColumn } from "../types";
import { parseBoardColumns } from "../utils";

export interface ProjectColumns {
  projectId: string;
  projectName: string;
  columns: BoardColumn[];
}

export const useWorkspaceColumns = (workspaceId: string) => {
  const { data: projects } = useGetProjects({ workspaceId });

  const byProject: ProjectColumns[] =
    projects?.documents.map((project) => ({
      projectId: project.$id,
      projectName: project.name,
      columns: parseBoardColumns(project.columnConfig).filter((column) => !column.hidden),
    })) ?? [];

  return byProject;
};
