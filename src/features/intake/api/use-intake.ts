import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage, responseErrorMessage } from "@/lib/http-error";

import type { IntakeSettings, IntakeSubmission } from "../schemas";

const intakeKey = (projectId: string) => ["intake-forms", projectId];

export const useGetIntakeForm = ({ projectId }: { projectId: string }) =>
  useQuery({
    enabled: Boolean(projectId),
    queryKey: intakeKey(projectId),
    queryFn: async () => {
      const response = await client.api.intake.project[":projectId"].$get({
        param: { projectId },
      });
      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors de la récupération du formulaire"),
        );
      }
      return (await response.json()).data;
    },
  });

export const useSaveIntakeForm = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (json: IntakeSettings) => {
      const response = await client.api.intake.project[":projectId"].$put({
        param: { projectId },
        json,
      });
      if (!response.ok) {
        throw new Error(
          await responseErrorMessage(response, "Erreur lors de l'enregistrement du formulaire"),
        );
      }
      return (await response.json()).data;
    },
    onSuccess: () => {
      toast.success("Formulaire enregistré");
      queryClient.invalidateQueries({ queryKey: intakeKey(projectId) });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useRegenerateIntakeToken = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.api.intake.project[":projectId"].token.$post({
        param: { projectId },
      });
      if (!response.ok) throw new Error("Erreur lors du changement d'adresse");
      return (await response.json()).data;
    },
    onSuccess: () => {
      toast.success("Nouvelle adresse créée : l'ancienne ne fonctionne plus");
      queryClient.invalidateQueries({ queryKey: intakeKey(projectId) });
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useDeleteIntakeForm = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const response = await client.api.intake.project[":projectId"].$delete({
        param: { projectId },
      });
      if (!response.ok) throw new Error("Erreur lors de la suppression du formulaire");
      return (await response.json()).data;
    },
    onSuccess: () => {
      toast.success("Formulaire supprimé");
      queryClient.invalidateQueries({ queryKey: intakeKey(projectId) });
    },
    onError: (error) => toast.error(error.message),
  });
};

/** Envoi depuis la page publique (sans connexion). */
export const useSubmitIntake = (token: string) =>
  useMutation({
    mutationFn: async (json: IntakeSubmission) => {
      const response = await client.api.intake.public[":token"].$post({
        param: { token },
        json,
      });
      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
        const message =
          response.status === 404
            ? "Ce formulaire n'est plus disponible."
            : typeof body?.error === "string" && response.status !== 400
              ? body.error
              : "Vérifiez les champs du formulaire.";
        throw new Error(message);
      }
      return (await response.json()).data;
    },
  });
