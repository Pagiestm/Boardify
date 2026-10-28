import { toast } from "sonner";
import { InferRequestType } from "hono";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { HttpError, httpErrorMessage, responseErrorMessage } from "@/lib/http-error";

type CreateSprintRequest = InferRequestType<(typeof client.api.sprints)["$post"]>;
type UpdateSprintRequest = InferRequestType<(typeof client.api.sprints)[":sprintId"]["$patch"]>;
type CompleteSprintRequest = InferRequestType<
  (typeof client.api.sprints)[":sprintId"]["complete"]["$post"]
>;

export const useGetSprints = ({
  projectId,
  enabled = true,
}: {
  projectId?: string | null;
  enabled?: boolean;
}) =>
  useQuery({
    ...LIVE_QUERY_OPTIONS,
    queryKey: ["sprints", projectId],
    enabled: enabled && Boolean(projectId),
    queryFn: async () => {
      const response = await client.api.sprints.$get({ query: { projectId: projectId! } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération des sprints"),
        );
      }

      const { data } = await response.json();
      return data;
    },
  });

const useSprintMutation = <TVariables, TData extends { projectId: string }>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  successMessage: (data: TData) => string,
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      toast.success(successMessage(data));
      queryClient.invalidateQueries({ queryKey: ["sprints", data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task"] });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useCreateSprint = () =>
  useSprintMutation(
    async ({ json }: CreateSprintRequest) => {
      const response = await client.api.sprints.$post({ json });
      if (!response.ok) {
        throw new Error(
          await responseErrorMessage(response, "Erreur lors de la création du sprint"),
        );
      }
      return (await response.json()).data;
    },
    () => "Sprint créé",
  );

export const useUpdateSprint = () =>
  useSprintMutation(
    async ({ param, json }: UpdateSprintRequest) => {
      const response = await client.api.sprints[":sprintId"].$patch({ param, json });
      if (!response.ok) {
        throw new Error(
          await responseErrorMessage(response, "Erreur lors de la mise à jour du sprint"),
        );
      }
      return (await response.json()).data;
    },
    () => "Sprint mis à jour",
  );

export const useCompleteSprint = () =>
  useSprintMutation(
    async ({ param, json }: CompleteSprintRequest) => {
      const response = await client.api.sprints[":sprintId"].complete.$post({ param, json });
      if (!response.ok) {
        throw new Error(
          await responseErrorMessage(response, "Erreur lors de la clôture du sprint"),
        );
      }
      return (await response.json()).data;
    },
    ({ moved }) =>
      moved > 0
        ? `Sprint terminé, ${moved} tâche${moved > 1 ? "s" : ""} reportée${moved > 1 ? "s" : ""}`
        : "Sprint terminé",
  );

export const useDeleteSprint = () =>
  useSprintMutation(
    async (sprintId: string) => {
      const response = await client.api.sprints[":sprintId"].$delete({ param: { sprintId } });
      if (!response.ok) throw new Error("Erreur lors de la suppression du sprint");
      return (await response.json()).data;
    },
    () => "Sprint supprimé",
  );
