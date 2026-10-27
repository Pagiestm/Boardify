import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.github.tasks)[":taskId"]["branch"]["$post"],
  200
>;
type RequestType = InferRequestType<(typeof client.api.github.tasks)[":taskId"]["branch"]["$post"]>;

export const useCreateGithubBranch = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.github.tasks[":taskId"].branch.$post({ param });

      if (!response.ok) {
        throw new Error("Échec de la création de la branche");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success(`Branche ${data.branch} créée`);
      queryClient.invalidateQueries({ queryKey: ["github-development", data.taskId] });
    },
    onError: () => {
      toast.error("Échec de la création de la branche");
    },
  });

  return mutation;
};
