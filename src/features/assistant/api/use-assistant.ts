import { toast } from "sonner";
import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { HttpError, httpErrorMessage } from "@/lib/http-error";

import { AiModel, AiProvider, AssistantSettingsInput, AssistantStatus } from "../types";

const assistant = client.api.assistant;
const statusKey = (workspaceId: string) => ["assistant", workspaceId];

const errorMessage = async (response: Response, fallback: string) => {
  const body = (await response.json().catch(() => null)) as { error?: unknown } | null;
  return typeof body?.error === "string" ? body.error : fallback;
};

export const useAssistantStatus = (workspaceId: string | undefined) =>
  useQuery({
    queryKey: statusKey(workspaceId ?? ""),
    enabled: Boolean(workspaceId),
    staleTime: 60_000,
    queryFn: async (): Promise<AssistantStatus> => {
      const response = await assistant.$get({ query: { workspaceId: workspaceId! } });
      if (!response.ok) {
        throw new HttpError(
          response.status,
          httpErrorMessage(response.status, "Erreur lors du chargement de l'assistant"),
        );
      }
      return (await response.json()).data as AssistantStatus;
    },
  });

/** L'assistant est prêt à être utilisé dans cet espace. */
export const useAssistantReady = (workspaceId: string | undefined) => {
  const { data } = useAssistantStatus(workspaceId);
  return Boolean(data?.configured && data.enabled);
};

export const useSaveAssistant = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (json: AssistantSettingsInput) => {
      const response = await assistant.$put({ json });
      if (!response.ok) {
        throw new Error(await errorMessage(response, "Impossible d'enregistrer l'assistant"));
      }
      return (await response.json()).data as AssistantStatus;
    },
    onSuccess: (data) => {
      toast.success("Assistant IA enregistré");
      queryClient.setQueryData(statusKey(workspaceId), data);
    },
    onError: (error) => toast.error(error.message),
  });
};

export const useDeleteAssistant = (workspaceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const response = await assistant.$delete({ query: { workspaceId } });
      if (!response.ok) throw new Error("Impossible de supprimer l'assistant");
      return (await response.json()).data as AssistantStatus;
    },
    onSuccess: (data) => {
      toast.success("Assistant IA supprimé");
      queryClient.setQueryData(statusKey(workspaceId), data);
    },
    onError: (error) => toast.error(error.message),
  });
};

/** Modèles proposés par le fournisseur pour la clé saisie (ou celle enregistrée). */
export const useAssistantModels = ({
  workspaceId,
  provider,
  apiKey,
  baseUrl,
  enabled,
}: {
  workspaceId: string;
  provider: AiProvider;
  apiKey?: string;
  baseUrl?: string | null;
  enabled: boolean;
}) =>
  useQuery({
    queryKey: ["assistant-models", workspaceId, provider, apiKey ?? "", baseUrl ?? ""],
    enabled,
    retry: false,
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<AiModel[]> => {
      const response = await assistant.models.$post({
        json: { workspaceId, provider, apiKey: apiKey || undefined, baseUrl: baseUrl || null },
      });
      if (!response.ok) {
        throw new Error(await errorMessage(response, "Impossible de récupérer les modèles"));
      }
      return (await response.json()).data as AiModel[];
    },
  });

export const useTestAssistant = () =>
  useMutation({
    mutationFn: async (json: AssistantSettingsInput) => {
      const response = await assistant.test.$post({ json });
      if (!response.ok) throw new Error(await errorMessage(response, "Test impossible"));
      return (await response.json()).data as { ok: boolean; reply?: string; error?: string };
    },
    onError: (error) => toast.error(error.message),
  });

/**
 * Lit une réponse en flux de texte. Le texte reçu est affiché progressivement (les
 * fournisseurs l'envoient souvent par gros blocs) ; « stop » fige le texte affiché et
 * interrompt la requête, ce qui coupe aussi la génération côté fournisseur.
 */
export const useAssistantStream = () => {
  const [text, setText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abort = useRef<AbortController | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const received = useRef("");
  const shown = useRef(0);
  const finished = useRef(false);

  const cancelFrame = () => {
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
  };

  const startTyping = () => {
    cancelFrame();
    timer.current = setInterval(() => {
      const remaining = received.current.length - shown.current;
      if (remaining > 0) {
        // Rattrape le retard en une demi-seconde environ, sans descendre sous 2 caractères.
        shown.current += Math.max(2, Math.ceil(remaining / 30));
        setText(received.current.slice(0, shown.current));
      }
      if (finished.current && shown.current >= received.current.length) {
        cancelFrame();
        setIsStreaming(false);
      }
    }, 16);
  };

  const start = useCallback(
    async (url: string, body: object) => {
      abort.current?.abort();
      cancelFrame();
      const controller = new AbortController();
      abort.current = controller;
      received.current = "";
      shown.current = 0;
      finished.current = false;
      setText("");
      setIsStreaming(true);

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
          signal: controller.signal,
        });
        if (!response.ok || !response.body) {
          toast.error(await errorMessage(response, "L'assistant n'a pas pu répondre"));
          setIsStreaming(false);
          return null;
        }

        startTyping();
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          received.current += decoder.decode(value, { stream: true });
        }
        finished.current = true;
        return received.current;
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          toast.error("L'assistant n'a pas pu répondre");
          cancelFrame();
          setIsStreaming(false);
        }
        return null;
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const stop = useCallback(() => {
    abort.current?.abort();
    cancelFrame();
    received.current = received.current.slice(0, shown.current);
    finished.current = true;
    setIsStreaming(false);
  }, []);

  useEffect(
    () => () => {
      abort.current?.abort();
      cancelFrame();
    },
    [],
  );

  return { text, isStreaming, start, stop, setText };
};
