import "server-only";

import { Project } from "@/features/projects/types";
import { parseBoardColumns } from "@/features/projects/utils";

import { isTaskDone } from "../utils";

export const isDoneStatus = (project: Project | undefined, status: string) =>
  isTaskDone({
    status,
    statusColumn: parseBoardColumns(project?.columnConfig).find((column) => column.id === status),
  });

export const getOpenStatus = (project: Project | undefined) => {
  const columns = parseBoardColumns(project?.columnConfig);
  return (columns.find((column) => !column.done && !column.hidden) ?? columns[0]).id;
};
