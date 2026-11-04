import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

/** Tous les projets de l'espace, avec leur avancement et leur santé. */
export const usePortfolio = (workspaceId: string) =>
  useQuery({
    ...LIVE_QUERY_OPTIONS,
    // Sous « tasks » : recalculé à chaque changement de tâche (le plus fréquent).
    queryKey: ["tasks", "portfolio", workspaceId],
    queryFn: async () => {
      const response = await client.api.portfolio.$get({ query: { workspaceId } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors du chargement du portefeuille"),
        );
      }

      const { data } = await response.json();
      return data;
    },
  });
