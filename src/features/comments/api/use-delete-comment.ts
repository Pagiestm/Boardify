import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.comments)[":commentId"]["$delete"], 200>;
type RequestType = InferRequestType<(typeof client.api.comments)[":commentId"]["$delete"]>;

export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.comments[":commentId"].$delete({ param });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du commentaire");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Commentaire supprimé");
      queryClient.invalidateQueries({ queryKey: ["comments", data.taskId] });
    },
    onError: () => {
      toast.error("Erreur lors de la suppression du commentaire");
    },
  });
};
