import { useQuery } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

interface UseFlowMetricsProps {
  projectId: string;
  sprintId?: string | null;
  days: number;
  enabled?: boolean;
}

/** Temps de cycle, débit et flux cumulé d'un projet (ou d'un sprint). */
export const useFlowMetrics = ({
  projectId,
  sprintId,
  days,
  enabled = true,
}: UseFlowMetricsProps) =>
  useQuery({
    // Sous « tasks » : recalculé à chaque changement de tâche.
    queryKey: ["tasks", "flow", projectId, sprintId ?? null, days],
    enabled,
    queryFn: async () => {
      const response = await client.api.flow.$get({
        query: {
          projectId,
          ...(sprintId ? { sprintId } : {}),
          days: String(days),
        },
      });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors du calcul des indicateurs"),
        );
      }

      const { data } = await response.json();
      return data;
    },
  });
