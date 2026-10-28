import { toast } from "sonner";
import { InferRequestType } from "hono";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

export const useGetSavedViews = ({ workspaceId }: { workspaceId: string }) =>
  useQuery({
    queryKey: ["saved-views", workspaceId],
    queryFn: async () => {
      const response = await client.api["saved-views"].$get({ query: { workspaceId } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération des vues"),
        );
      }

      const { data } = await response.json();
      return data;
    },
  });

export const useCreateSavedView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ json }: InferRequestType<(typeof client.api)["saved-views"]["$post"]>) => {
      const response = await client.api["saved-views"].$post({ json });
      if (!response.ok) throw new Error("Erreur lors de l'enregistrement de la vue");
      return (await response.json()).data;
    },
    onSuccess: ({ workspaceId }) => {
      toast.success("Vue enregistrée");
      queryClient.invalidateQueries({ queryKey: ["saved-views", workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useDeleteSavedView = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (viewId: string) => {
      const response = await client.api["saved-views"][":viewId"].$delete({
        param: { viewId },
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression de la vue");
      return (await response.json()).data;
    },
    onSuccess: ({ workspaceId }) => {
      queryClient.invalidateQueries({ queryKey: ["saved-views", workspaceId] });
    },
    onError: (error) => toast.error(error.message),
  });
};
