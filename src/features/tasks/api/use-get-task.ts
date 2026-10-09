import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

interface useGetTaskProps {
  taskId: string;
}

export const useGetTask = ({ taskId }: useGetTaskProps) => {
  const query = useQuery({
    queryKey: ["task", taskId],
    queryFn: async () => {
      const response = await client.api.tasks[":taskId"].$get({
        param: {
          taskId,
        },
      });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération de la tâche"),
        );
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
