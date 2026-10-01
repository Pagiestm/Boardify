import { parseAsString, useQueryStates } from "nuqs";

export const useTaskFilters = () => {
  return useQueryStates({
    projectId: parseAsString,
    status: parseAsString,
    assigneeId: parseAsString,
    search: parseAsString,
    dueDate: parseAsString,
    labelId: parseAsString,
  });
};
