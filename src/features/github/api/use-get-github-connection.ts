import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

interface UseGetGithubConnectionProps {
  workspaceId: string;
}

export const useGetGithubConnection = ({ workspaceId }: UseGetGithubConnectionProps) => {
  const query = useQuery({
    queryKey: ["github", workspaceId],
    queryFn: async () => {
      const response = await client.api.github[":workspaceId"].$get({
        param: { workspaceId },
      });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Échec de la récupération de la connexion GitHub"),
        );
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
