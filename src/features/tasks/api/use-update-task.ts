import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<(typeof client.api.tasks)[":taskId"]["$patch"], 200>;
type RequestType = InferRequestType<(typeof client.api.tasks)[":taskId"]["$patch"]>;

export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ json, param }) => {
      const response = await client.api.tasks[":taskId"]["$patch"]({ json, param });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(
          (response.status === 400 && typeof body?.error === "string" && body.error) ||
            "Erreur lors de la mise à jour de la tâche",
        );
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      toast.success("Tâche mise à jour");

      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task", data.$id] });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  return mutation;
};
