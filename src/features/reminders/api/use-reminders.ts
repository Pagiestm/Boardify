import { toast } from "sonner";
import { InferRequestType } from "hono";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage, responseErrorMessage } from "@/lib/http-error";

export const useGetReminders = ({ taskId }: { taskId: string }) =>
  useQuery({
    queryKey: ["reminders", taskId],
    queryFn: async () => {
      const response = await client.api.reminders.$get({ query: { taskId } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération des rappels"),
        );
      }

      return (await response.json()).data;
    },
  });

export const useCreateReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ json }: InferRequestType<(typeof client.api.reminders)["$post"]>) => {
      const response = await client.api.reminders.$post({ json });
      if (!response.ok) {
        throw new Error(await responseErrorMessage(response, "Impossible de créer le rappel"));
      }
      return (await response.json()).data;
    },
    onSuccess: (reminder) => {
      toast.success("Rappel programmé");
      queryClient.invalidateQueries({ queryKey: ["reminders", reminder.taskId] });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useDeleteReminder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      param,
    }: InferRequestType<(typeof client.api.reminders)[":reminderId"]["$delete"]>) => {
      const response = await client.api.reminders[":reminderId"].$delete({ param });
      if (!response.ok) throw new Error("Impossible de supprimer le rappel");
      return (await response.json()).data;
    },
    onSuccess: (reminder) =>
      queryClient.invalidateQueries({ queryKey: ["reminders", reminder.taskId] }),
    onError: (error) => toast.error(error.message),
  });
};
