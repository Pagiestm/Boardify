import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.github.installations)[":workspaceId"]["$delete"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.github.installations)[":workspaceId"]["$delete"]
>;

export const useUnlinkGithubInstallation = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.github.installations[":workspaceId"].$delete({ param });

      if (!response.ok) {
        throw new Error("Échec de la déconnexion de GitHub");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("GitHub déconnecté");

      queryClient.invalidateQueries({ queryKey: ["github", data.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["workspace", data.workspaceId] });
    },
    onError: () => {
      toast.error("Échec de la déconnexion de GitHub");
    },
  });

  return mutation;
};
