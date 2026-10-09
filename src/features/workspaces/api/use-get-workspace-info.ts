import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

interface useGetWorkspaceInfoProps {
  workspaceId: string;
}

export const useGetWorkspaceInfo = ({ workspaceId }: useGetWorkspaceInfoProps) => {
  const query = useQuery({
    queryKey: ["workspace-info", workspaceId],
    queryFn: async () => {
      const response = await client.api.workspaces[":workspaceId"]["info"].$get({
        param: { workspaceId },
      });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(
            response.status,
            "Échec de la récupération des informations de l'espace de travail",
          ),
        );
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
