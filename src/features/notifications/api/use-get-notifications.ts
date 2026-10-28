import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

export const useGetNotifications = () =>
  useQuery({
    queryKey: ["notifications"],
    refetchInterval: 15_000,
    refetchIntervalInBackground: true,
    refetchOnWindowFocus: "always",
    queryFn: async () => {
      const response = await client.api.notifications.$get();

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération des notifications"),
        );
      }

      const { data } = await response.json();
      return data;
    },
  });
