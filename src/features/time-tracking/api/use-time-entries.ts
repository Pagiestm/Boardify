import { toast } from "sonner";
import { InferRequestType } from "hono";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { HttpError, httpErrorMessage, responseErrorMessage } from "@/lib/http-error";

export const useGetTimeEntries = ({ taskId }: { taskId: string }) =>
  useQuery({
    ...LIVE_QUERY_OPTIONS,
    queryKey: ["time-entries", taskId],
    queryFn: async () => {
      const response = await client.api["time-entries"].$get({ query: { taskId } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération du temps passé"),
        );
      }

      return (await response.json()).data;
    },
  });

interface TimeReportProps {
  workspaceId: string;
  sprintId?: string;
  days?: number;
  enabled?: boolean;
}

/** Temps par membre sur un sprint, ou sur les `days` derniers jours. */
export const useGetTimeReport = ({
  workspaceId,
  sprintId,
  days,
  enabled = true,
}: TimeReportProps) =>
  useQuery({
    enabled,
    queryKey: ["time-entries", "report", workspaceId, sprintId ?? null, days ?? null],
    queryFn: async () => {
      const response = await client.api["time-entries"].report.$get({
        query: { workspaceId, sprintId, days: days ? String(days) : undefined },
      });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération du rapport"),
        );
      }

      return (await response.json()).data;
    },
  });

const useInvalidateTimeEntries = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["time-entries"] });
};

export const useStartTimer = () => {
  const invalidate = useInvalidateTimeEntries();

  return useMutation({
    mutationFn: async ({
      json,
    }: InferRequestType<(typeof client.api)["time-entries"]["start"]["$post"]>) => {
      const response = await client.api["time-entries"].start.$post({ json });
      if (!response.ok) {
        throw new Error(
          await responseErrorMessage(response, "Impossible de démarrer le chronomètre"),
        );
      }
      return (await response.json()).data;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });
};

export const useStopTimer = () => {
  const invalidate = useInvalidateTimeEntries();

  return useMutation({
    mutationFn: async ({
      json,
    }: InferRequestType<(typeof client.api)["time-entries"]["stop"]["$post"]>) => {
      const response = await client.api["time-entries"].stop.$post({ json });
      if (!response.ok) throw new Error("Impossible d'arrêter le chronomètre");
      return (await response.json()).data;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });
};

export const useAddTimeEntry = () => {
  const invalidate = useInvalidateTimeEntries();

  return useMutation({
    mutationFn: async ({
      json,
    }: InferRequestType<(typeof client.api)["time-entries"]["$post"]>) => {
      const response = await client.api["time-entries"].$post({ json });
      if (!response.ok) {
        throw new Error(await responseErrorMessage(response, "Impossible d'ajouter ce temps"));
      }
      return (await response.json()).data;
    },
    onSuccess: () => {
      toast.success("Temps ajouté");
      invalidate();
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useDeleteTimeEntry = () => {
  const invalidate = useInvalidateTimeEntries();

  return useMutation({
    mutationFn: async ({
      param,
    }: InferRequestType<(typeof client.api)["time-entries"][":entryId"]["$delete"]>) => {
      const response = await client.api["time-entries"][":entryId"].$delete({ param });
      if (!response.ok) throw new Error("Impossible de supprimer ce temps");
      return (await response.json()).data;
    },
    onSuccess: invalidate,
    onError: (error) => toast.error(error.message),
  });
};
