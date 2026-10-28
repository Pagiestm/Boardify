import { toast } from "sonner";
import { InferRequestType } from "hono";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

export const useGetTemplates = ({ workspaceId }: { workspaceId: string }) =>
  useQuery({
    queryKey: ["templates", workspaceId],
    queryFn: async () => {
      const response = await client.api.templates.$get({ query: { workspaceId } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération des modèles"),
        );
      }

      const { data } = await response.json();
      return data;
    },
  });

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ json }: InferRequestType<(typeof client.api.templates)["$post"]>) => {
      const response = await client.api.templates.$post({ json });
      if (!response.ok) throw new Error("Erreur lors de l'enregistrement du modèle");
      return (await response.json()).data;
    },
    onSuccess: ({ workspaceId }) => {
      toast.success("Modèle enregistré");
      queryClient.invalidateQueries({ queryKey: ["templates", workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useDeleteTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (templateId: string) => {
      const response = await client.api.templates[":templateId"].$delete({
        param: { templateId },
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression du modèle");
      return (await response.json()).data;
    },
    onSuccess: ({ workspaceId }) => {
      toast.success("Modèle supprimé");
      queryClient.invalidateQueries({ queryKey: ["templates", workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });
};
