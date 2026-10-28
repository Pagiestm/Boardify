import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

import { MAX_ATTACHMENT_SIZE } from "../types";

export const useGetAttachments = ({ taskId }: { taskId: string }) =>
  useQuery({
    ...LIVE_QUERY_OPTIONS,
    queryKey: ["attachments", taskId],
    queryFn: async () => {
      const response = await client.api.attachments.$get({ query: { taskId } });

      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération des pièces jointes"),
        );
      }

      const { data } = await response.json();
      return data;
    },
  });

export const useUploadAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ taskId, file }: { taskId: string; file: File }) => {
      if (file.size > MAX_ATTACHMENT_SIZE) {
        throw new Error(`« ${file.name} » dépasse 10 Mo`);
      }

      const response = await client.api.attachments.$post({ form: { taskId, file } });
      if (!response.ok) throw new Error(`Envoi de « ${file.name} » impossible`);

      return (await response.json()).data;
    },
    onSuccess: (attachment) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", attachment.taskId] });
      queryClient.invalidateQueries({ queryKey: ["activities", attachment.taskId] });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useDeleteAttachment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (attachmentId: string) => {
      const response = await client.api.attachments[":attachmentId"].$delete({
        param: { attachmentId },
      });
      if (!response.ok) throw new Error("Suppression de la pièce jointe impossible");

      return (await response.json()).data;
    },
    onSuccess: ({ taskId }) => {
      queryClient.invalidateQueries({ queryKey: ["attachments", taskId] });
      queryClient.invalidateQueries({ queryKey: ["activities", taskId] });
    },
    onError: (error) => toast.error(error.message),
  });
};
