import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { HttpError, httpErrorMessage, responseErrorMessage } from "@/lib/http-error";

import type { PokerValue } from "../utils";

export const useGetPoker = ({ taskId }: { taskId: string }) =>
  useQuery({
    ...LIVE_QUERY_OPTIONS,
    queryKey: ["poker", taskId],
    queryFn: async () => {
      const response = await client.api.poker.$get({ query: { taskId } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération de l'estimation"),
        );
      }

      return (await response.json()).data;
    },
  });

type PokerAction = "start" | "reveal" | "round" | "end";

/** Actions de la séance : lancer, révéler, nouveau tour, terminer. */
export const usePokerAction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, action }: { taskId: string; action: PokerAction }) => {
      const response =
        action === "end"
          ? await client.api.poker.$delete({ query: { taskId } })
          : await client.api.poker[action].$post({ json: { taskId } });
      if (!response.ok) {
        throw new Error(await responseErrorMessage(response, "Action impossible sur l'estimation"));
      }
      return taskId;
    },
    onSuccess: (taskId) => queryClient.invalidateQueries({ queryKey: ["poker", taskId] }),
    onError: (error) => toast.error(error.message),
  });
};

export const usePokerVote = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, value }: { taskId: string; value: PokerValue }) => {
      const response = await client.api.poker.vote.$post({ json: { taskId, value } });
      if (!response.ok) throw new Error(await responseErrorMessage(response, "Vote impossible"));
      return taskId;
    },
    onSuccess: (taskId) => queryClient.invalidateQueries({ queryKey: ["poker", taskId] }),
    onError: (error) => toast.error(error.message),
  });
};
