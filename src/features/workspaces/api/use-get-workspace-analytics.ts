import { InferResponseType } from "hono";
import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

interface useGetWorkspaceAnalyticsProps {
  workspaceId: string;
}

export type WorkspaceAnalyticsResponseType = InferResponseType<
  (typeof client.api.workspaces)[":workspaceId"]["analytics"]["$get"],
  200
>;

export const useGetWorkspaceAnalytics = ({ workspaceId }: useGetWorkspaceAnalyticsProps) => {
  const query = useQuery({
    queryKey: ["workspace-analytics", workspaceId],
    queryFn: async () => {
      const response = await client.api.workspaces[":workspaceId"]["analytics"].$get({
        param: { workspaceId },
      });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(
            response.status,
            "Échec de la récupération des analyses de l'espace de travail",
          ),
        );
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
