import { toast } from "sonner";
import { InferRequestType } from "hono";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

export const useGetChecklist = ({ taskId }: { taskId: string }) =>
  useQuery({
    ...LIVE_QUERY_OPTIONS,
    queryKey: ["checklist", taskId],
    queryFn: async () => {
      const response = await client.api.checklist.$get({ query: { taskId } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération des sous-tâches"),
        );
      }

      const { data } = await response.json();
      return data;
    },
  });

const useInvalidateChecklist = () => {
  const queryClient = useQueryClient();

  return (taskId: string) => {
    queryClient.invalidateQueries({ queryKey: ["checklist", taskId] });
    queryClient.invalidateQueries({ queryKey: ["tasks"] });
  };
};

export const useCreateChecklistItem = () => {
  const invalidate = useInvalidateChecklist();

  return useMutation({
    mutationFn: async ({ json }: InferRequestType<(typeof client.api.checklist)["$post"]>) => {
      const response = await client.api.checklist.$post({ json });
      if (!response.ok) throw new Error("Erreur lors de l'ajout de la sous-tâche");
      return (await response.json()).data;
    },
    onSuccess: (item) => invalidate(item.taskId),
    onError: (error) => toast.error(error.message),
  });
};

export const useUpdateChecklistItem = () => {
  const invalidate = useInvalidateChecklist();

  return useMutation({
    mutationFn: async ({
      param,
      json,
    }: InferRequestType<(typeof client.api.checklist)[":itemId"]["$patch"]>) => {
      const response = await client.api.checklist[":itemId"].$patch({ param, json });
      if (!response.ok) throw new Error("Erreur lors de la modification de la sous-tâche");
      return (await response.json()).data;
    },
    onSuccess: (item) => invalidate(item.taskId),
    onError: (error) => toast.error(error.message),
  });
};

export const useDeleteChecklistItem = () => {
  const invalidate = useInvalidateChecklist();

  return useMutation({
    mutationFn: async ({
      param,
    }: InferRequestType<(typeof client.api.checklist)[":itemId"]["$delete"]>) => {
      const response = await client.api.checklist[":itemId"].$delete({ param });
      if (!response.ok) throw new Error("Erreur lors de la suppression de la sous-tâche");
      return (await response.json()).data;
    },
    onSuccess: (item) => invalidate(item.taskId),
    onError: (error) => toast.error(error.message),
  });
};
