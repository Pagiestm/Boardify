import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

export const useGetWorkspaces = () => {
  const query = useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const response = await client.api.workspaces.$get();

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Échec de la récupération des espaces de travail"),
        );
      }

      const { data } = await response.json();

      return data;
    },
  });

  return query;
};
