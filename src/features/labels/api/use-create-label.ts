import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.labels)["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api.labels)["$post"]>;

export const useCreateLabel = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.labels["$post"]({ json });

      if (!response.ok) {
        const body = await response.json();
        const message =
          "error" in body && typeof body.error === "string"
            ? body.error
            : "Erreur lors de la création de l'étiquette";
        throw new Error(message);
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Étiquette créée");
      queryClient.invalidateQueries({ queryKey: ["labels"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });
};
