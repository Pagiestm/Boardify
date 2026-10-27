import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.github.installations)["$post"], 200>;
type RequestType = InferRequestType<(typeof client.api.github.installations)["$post"]>;

export const useLinkGithubInstallation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json }) => {
      const response = await client.api.github.installations.$post({ json });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(body?.error ?? "Échec de la connexion à GitHub");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["github", data.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspace", data.workspaceId] });
    },
  });

  return mutation;
};
