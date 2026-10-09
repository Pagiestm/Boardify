import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

interface UseGetLabelsProps {
  workspaceId: string;
}

export const useGetLabels = ({ workspaceId }: UseGetLabelsProps) => {
  return useQuery({
    queryKey: ["labels", workspaceId],
    queryFn: async () => {
      const response = await client.api.labels.$get({ query: { workspaceId } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors du chargement des étiquettes"),
        );
      }

      const { data } = await response.json();
      return data;
    },
  });
};
