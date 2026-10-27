import { toast } from "sonner";
import { InferRequestType, InferResponseType } from "hono";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";

type ResponseType = InferResponseType<
  (typeof client.api.github.projects)[":projectId"]["import"]["$post"],
  200
>;
type RequestType = InferRequestType<
  (typeof client.api.github.projects)[":projectId"]["import"]["$post"]
>;

export const useImportGithubIssues = () => {
  const queryClient = useQueryClient();

  const mutation = useMutation<ResponseType, Error, RequestType>({
    mutationFn: async ({ param }) => {
      const response = await client.api.github.projects[":projectId"].import.$post({ param });

      if (!response.ok) {
        throw new Error("Échec de l'import des issues GitHub");
      }

      return await response.json();
    },
    onSuccess: ({ data }) => {
      const plural = data.imported > 1 ? "s" : "";
      toast.success(
        data.imported > 0
          ? `${data.imported} tâche${plural} importée${plural}`
          : "Aucune nouvelle issue à importer",
        data.skipped > 0
          ? { description: `${data.skipped} issue(s) déjà liée(s) à une tâche` }
          : {},
      );

      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
    },
    onError: () => {
      toast.error("Échec de l'import des issues GitHub");
    },
  });

  return mutation;
};
