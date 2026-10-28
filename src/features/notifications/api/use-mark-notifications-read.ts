import { InferRequestType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type RequestType = InferRequestType<(typeof client.api.notifications.read)["$post"]>;

export const useMarkNotificationsRead = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.notifications.read.$post({ json });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour des notifications");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
};
