import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.comments)["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api.comments)["$post"]>;

export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.comments.$post({ json });

      if (!response.ok) {
        throw new Error("Erreur lors de l'envoi du commentaire");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["comments", data.taskId] });
    },
    onError: () => {
      toast.error("Erreur lors de l'envoi du commentaire");
    },
  });
};
