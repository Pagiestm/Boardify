import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

interface UseGetGithubDevelopmentProps {
  taskId: string;
  enabled?: boolean;
}

export const useGetGithubDevelopment = ({
  taskId,
  enabled = true,
}: UseGetGithubDevelopmentProps) => {
  const query = useQuery({
    enabled,
    queryKey: ["github-development", taskId],
    queryFn: async () => {
      const response = await client.api.github.tasks[":taskId"].development.$get({
        param: { taskId },
      });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Échec de la lecture de GitHub"),
        );
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
