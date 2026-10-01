import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.projects)[":projectId"]["columns"]["$patch"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.projects)[":projectId"]["columns"]["$patch"]
>;

export const useUpdateBoardColumns = () => {
  const queryClient = useQueryClient();

  return useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.projects[":projectId"]["columns"]["$patch"]({
        json,
        param,
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'enregistrement des colonnes");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Colonnes mises à jour");
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      queryClient.invalidateQueries({ queryKey: ["project", data.$id] });
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement des colonnes");
    },
  });
};
