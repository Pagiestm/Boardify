import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.comments)[":commentId"]["$patch"], 200>;
type RequestType = InferRequestType<(typeof client.api.comments)[":commentId"]["$patch"]>;

export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.comments[":commentId"].$patch({ json, param });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification du commentaire");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data.taskId] });
    },
    onError: () => {
      toast.error("Erreur lors de la modification du commentaire");
    },
  });
};
