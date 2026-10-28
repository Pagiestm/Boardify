import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

const queryKey = (workspaceId: string) => ["calendar-subscription", workspaceId];

export const useGetCalendarSubscription = ({
  workspaceId,
  enabled = true,
}: {
  workspaceId: string;
  enabled?: boolean;
}) =>
  useQuery({
    queryKey: queryKey(workspaceId),
    enabled,
    queryFn: async () => {
      const response = await client.api.calendar.subscription.$get({ query: { workspaceId } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération de l'abonnement"),
        );
      }

      return (await response.json()).data;
    },
  });

export const useCreateCalendarSubscription = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.api.calendar.subscription.$post({ json: { workspaceId } });
      if (!response.ok) throw new Error("Erreur lors de la création du lien");
      return (await response.json()).data;
    },
    onSuccess: (data) => queryClient.setQueryData(queryKey(workspaceId), data),
    onError: (error) => toast.error(error.message),
  });
};

export const useDeleteCalendarSubscription = (workspaceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.api.calendar.subscription.$delete({ query: { workspaceId } });
      if (!response.ok) throw new Error("Erreur lors de la désactivation du lien");
      return (await response.json()).data;
    },
    onSuccess: (data) => {
      toast.success("Lien désactivé");
      queryClient.setQueryData(queryKey(workspaceId), data);
    },
    onError: (error) => toast.error(error.message),
  });
};
