import { toast } from "sonner";
import { InferRequestType } from "hono";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { HttpError, httpErrorMessage, responseErrorMessage } from "@/lib/http-error";

type CreateRequest = InferRequestType<(typeof client.api.retro)["$post"]>;
type UpdateRequest = InferRequestType<(typeof client.api.retro)[":itemId"]["$patch"]>;
type TaskRequest = InferRequestType<(typeof client.api.retro)[":itemId"]["task"]["$post"]>;

/** Éléments de la rétrospective d'un sprint ; `enabled` faux si la collection manque. */
export const useRetro = (sprintId: string | null | undefined) =>
  useQuery({
    ...LIVE_QUERY_OPTIONS,
    queryKey: ["retro", sprintId],
    enabled: Boolean(sprintId),
    queryFn: async () => {
      const response = await client.api.retro.$get({ query: { sprintId: sprintId! } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors du chargement de la rétrospective"),
        );
      }

      const { data } = await response.json();
      return data;
    },
  });

const useRetroMutation = <TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  { successMessage, alsoRefresh = [] }: { successMessage?: string; alsoRefresh?: string[][] } = {},
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (successMessage) toast.success(successMessage);
      for (const queryKey of [["retro"], ...alsoRefresh]) {
        queryClient.invalidateQueries({ queryKey });
      }
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useCreateRetroItem = () =>
  useRetroMutation(async ({ json }: CreateRequest) => {
    const response = await client.api.retro.$post({ json });
    if (!response.ok) {
      throw new Error(await responseErrorMessage(response, "Impossible d'ajouter cet élément"));
    }
    return (await response.json()).data;
  });

export const useUpdateRetroItem = () =>
  useRetroMutation(async ({ param, json }: UpdateRequest) => {
    const response = await client.api.retro[":itemId"].$patch({ param, json });
    if (!response.ok) {
      throw new Error(await responseErrorMessage(response, "Impossible de modifier cet élément"));
    }
    return (await response.json()).data;
  });

export const useDeleteRetroItem = () =>
  useRetroMutation(async (itemId: string) => {
    const response = await client.api.retro[":itemId"].$delete({ param: { itemId } });
    if (!response.ok) throw new Error("Impossible de supprimer cet élément");
    return (await response.json()).data;
  });

export const useCreateRetroTask = () =>
  useRetroMutation(
    async ({ param, json }: TaskRequest) => {
      const response = await client.api.retro[":itemId"].task.$post({ param, json });
      if (!response.ok) {
        throw new Error(await responseErrorMessage(response, "Impossible de créer la tâche"));
      }
      return (await response.json()).data;
    },
    { successMessage: "Tâche créée", alsoRefresh: [["tasks"]] },
  );
