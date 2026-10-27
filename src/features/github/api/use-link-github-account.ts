import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.github.account)["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api.github.account)["$post"]>;

export const useLinkGithubAccount = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.github.account.$post({ json });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Échec de la liaison du compte GitHub");
      }

      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["github"] });
    },
  });

  return mutation;
};
