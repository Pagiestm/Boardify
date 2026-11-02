import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

import { usePendingTaskDeletes } from "../pending-deletes";

interface useGetTasksProps {
  workspaceId: string;
  projectId?: string | null;
  status?: string | null;
  search?: string | null;
  assigneeId?: string | null;
  dueDate?: string | null;
  labelId?: string | null;
  sprintId?: string | null;
  enabled?: boolean;
}

export const useGetTasks = ({
  workspaceId,
  projectId,
  status,
  search,
  assigneeId,
  dueDate,
  labelId,
  sprintId,
  enabled = true,
}: useGetTasksProps) => {
  // Les tâches en cours de suppression (encore annulables) sont déjà masquées.
  const hidden = usePendingTaskDeletes();

  const query = useQuery({
    ...LIVE_QUERY_OPTIONS,
    enabled,
    select: (data) => {
      if (hidden.size === 0) return data;
      const documents = data.documents.filter((task) => !hidden.has(task.$id));
      return { ...data, documents, total: data.total - (data.documents.length - documents.length) };
    },
    queryKey: [
      "tasks",
      workspaceId,
      projectId,
      status,
      search,
      assigneeId,
      dueDate,
      labelId,
      sprintId,
    ],
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
          sprintId: sprintId ?? undefined,
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
