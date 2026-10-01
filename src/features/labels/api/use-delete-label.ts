import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.labels)[":labelId"]["$delete"], 200>;
type RequestType = InferRequestType<(typeof client.api.labels)[":labelId"]["$delete"]>;

export const useDeleteLabel = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.labels[":labelId"]["$delete"]({ param });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de l'étiquette");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Étiquette supprimée");
      queryClient.invalidateQueries({ queryKey: ["labels"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de l'étiquette");
    },
  });
};
