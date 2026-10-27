import { toast } from "sonner";
import { InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.github.account)["$delete"], 200>;

export const useUnlinkGithubAccount = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error>({
    mutationFn: async () => {
      const response = await client.api.github.account.$delete();

      if (!response.ok) {
        throw new Error("Échec de la déliaison du compte GitHub");
      }

      return await response.json();
    },
    onSuccess: () => {
      toast.success("Compte GitHub délié");
      queryClient.invalidateQueries({ queryKey: ["github"] });
    },
    onError: () => {
      toast.error("Échec de la déliaison du compte GitHub");
    },
  });

  return mutation;
};
