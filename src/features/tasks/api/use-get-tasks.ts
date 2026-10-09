import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

interface useGetTasksProps {
  workspaceId: string;
  projectId?: string | null;
  status?: string | null;
  search?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  labelId?: string | null;
}

export const useGetTasks = ({
  workspaceId,
  projectId,
  status,
  search,
  assigneeId,
  dueDate,
  labelId,
}: useGetTasksProps) => {
  const query = useQuery({
    queryKey: ["tasks", workspaceId, projectId, status, search, assigneeId, dueDate, labelId],
    queryFn: async () => {
      const response = await client.api.tasks.$get({
        query: {
          workspaceId,
          projectId: projectId ?? undefined,
          status: status ?? undefined,
          search: search ?? undefined,
          assigneeId: assigneeId ?? undefined,
          dueDate: dueDate ?? undefined,
          labelId: labelId ?? undefined,
        },
      });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération des tâches"),
        );
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
