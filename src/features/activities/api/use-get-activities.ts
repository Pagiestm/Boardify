import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

export const useGetActivities = ({ taskId }: { taskId: string }) =>
  useQuery({
    ...LIVE_QUERY_OPTIONS,
    queryKey: ["activities", taskId],
    queryFn: async () => {
      const response = await client.api.activities.$get({ query: { taskId } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération de l'activité"),
        );
      }

      const { data } = await response.json();
      return data;
    },
  });
