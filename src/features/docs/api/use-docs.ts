import { toast } from "sonner";
import { InferRequestType } from "hono";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { LIVE_QUERY_OPTIONS } from "@/lib/live-query";
import { HttpError, httpErrorMessage, responseErrorMessage } from "@/lib/http-error";

export const useGetDocs = ({
  projectId,
  enabled = true,
}: {
  projectId: string;
  enabled?: boolean;
}) =>
  useQuery({
    ...LIVE_QUERY_OPTIONS,
    enabled: enabled && Boolean(projectId),
    queryKey: ["docs", "list", projectId],
    queryFn: async () => {
      const response = await client.api.docs.$get({ query: { projectId } });
      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération de la documentation"),
        );
      }
      return (await response.json()).data;
    },
  });

export const useGetDoc = ({ docId }: { docId: string | null }) =>
  useQuery({
    ...LIVE_QUERY_OPTIONS,
    enabled: Boolean(docId),
    queryKey: ["docs", "page", docId],
    queryFn: async () => {
      const response = await client.api.docs[":docId"].$get({ param: { docId: docId! } });
      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération de la page"),
        );
      }
      return (await response.json()).data;
    },
  });

export const useCreateDoc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ json }: InferRequestType<(typeof client.api.docs)["$post"]>) => {
      const response = await client.api.docs.$post({ json });
      if (!response.ok) {
        throw new Error(
          await responseErrorMessage(response, "Erreur lors de la création de la page"),
        );
      }
      return (await response.json()).data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["docs"] }),
    onError: (error) => toast.error(error.message),
  });
};

export const useUpdateDoc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      param,
      json,
    }: InferRequestType<(typeof client.api.docs)[":docId"]["$patch"]>) => {
      const response = await client.api.docs[":docId"].$patch({ param, json });
      if (!response.ok) {
        throw new Error(
          await responseErrorMessage(response, "Erreur lors de l'enregistrement de la page"),
        );
      }
      return (await response.json()).data;
    },
    onSuccess: () => {
      toast.success("Page enregistrée");
      queryClient.invalidateQueries({ queryKey: ["docs"] });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useDeleteDoc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (docId: string) => {
      const response = await client.api.docs[":docId"].$delete({ param: { docId } });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
        throw new Error(
          typeof body?.error === "string" ? body.error : "Erreur lors de la suppression de la page",
        );
      }
      return (await response.json()).data;
    },
    onSuccess: () => {
      toast.success("Page supprimée");
      queryClient.invalidateQueries({ queryKey: ["docs"] });
    },
    onError: (error) => toast.error(error.message),
  });
};
