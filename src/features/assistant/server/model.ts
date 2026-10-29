import "server-only";

import { APICallError, type LanguageModel } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogle } from "@ai-sdk/google";
import { createMistral } from "@ai-sdk/mistral";
import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { Query, type Models } from "node-appwrite";

import { createAdminClient } from "@/lib/appwrite";
import { AI_SETTINGS_ID, DATABASE_ID } from "@/config";

import { AiProvider } from "../types";
import { decryptSecret } from "./crypto";

export type AiSettings = Models.Document & {
  workspaceId: string;
  provider: AiProvider;
  model: string;
  baseUrl?: string | null;
  apiKeyEncrypted: string;
  apiKeyHint?: string | null;
  enabled?: boolean;
  updatedBy?: string | null;
};

export const getAiSettings = async (workspaceId: string) => {
  if (!AI_SETTINGS_ID) return null;
  const { databases } = await createAdminClient();
  const { documents } = await databases.listDocuments<AiSettings>(DATABASE_ID, AI_SETTINGS_ID, [
    Query.equal("workspaceId", workspaceId),
    Query.limit(1),
  ]);
  return documents[0] ?? null;
};

/** Réglages d'un espace supprimé (collection accessible à la clé admin seule). */
export const deleteWorkspaceAssistant = async (workspaceId: string) => {
  const settings = await getAiSettings(workspaceId);
  if (!settings) return;
  const { databases } = await createAdminClient();
  await databases.deleteDocument(DATABASE_ID, AI_SETTINGS_ID, settings.$id);
};

export const createModel = (config: {
  provider: AiProvider;
  model: string;
  apiKey: string;
  baseUrl?: string | null;
}): LanguageModel => {
  const { provider, model, apiKey, baseUrl } = config;
  switch (provider) {
    case AiProvider.OPENAI:
      return createOpenAI({ apiKey })(model);
    case AiProvider.ANTHROPIC:
      return createAnthropic({ apiKey })(model);
    case AiProvider.MISTRAL:
      return createMistral({ apiKey })(model);
    case AiProvider.GOOGLE:
      return createGoogle({ apiKey })(model);
    case AiProvider.OPENAI_COMPATIBLE:
      return createOpenAICompatible({ name: "compatible", apiKey, baseURL: baseUrl ?? "" })(model);
  }
};

/** Modèle de l'espace, ou null si l'assistant n'est pas configuré ou désactivé. */
export const getWorkspaceModel = async (workspaceId: string) => {
  const settings = await getAiSettings(workspaceId);
  if (!settings || settings.enabled === false) return null;

  return createModel({
    provider: settings.provider,
    model: settings.model,
    apiKey: decryptSecret(settings.apiKeyEncrypted),
    baseUrl: settings.baseUrl,
  });
};

/** Message d'erreur lisible à partir d'une erreur du fournisseur. */
export const describeAiError = (error: unknown) => {
  if (APICallError.isInstance(error)) {
    switch (error.statusCode) {
      case 401:
      case 403:
        return "Clé d'API refusée par le fournisseur : vérifiez-la dans les paramètres de l'espace.";
      case 404:
        return "Modèle introuvable chez ce fournisseur : vérifiez son nom dans les paramètres.";
      case 402:
      case 429:
        return "Limite ou crédit atteint chez le fournisseur d'IA. Réessayez plus tard.";
      default:
        if (error.statusCode && error.statusCode >= 500) {
          return "Le fournisseur d'IA ne répond pas pour le moment. Réessayez dans un instant.";
        }
    }
    return `Erreur du fournisseur d'IA${error.statusCode ? ` (${error.statusCode})` : ""}.`;
  }
  if (error instanceof Error && (error.name === "TimeoutError" || error.name === "AbortError")) {
    return "Le fournisseur d'IA n'a pas répondu à temps. Réessayez, ou choisissez un modèle plus rapide.";
  }
  if (error instanceof Error && /fetch failed|ENOTFOUND|ECONNREFUSED/.test(error.message)) {
    return "Impossible de joindre le fournisseur d'IA : vérifiez l'adresse du service.";
  }
  return "L'assistant n'a pas pu répondre. Réessayez dans un instant.";
};

/**
 * Transforme un flux de texte en réponse HTTP. Une erreur survenue avant le premier
 * morceau (clé refusée, modèle inconnu…) est renvoyée en JSON avec un statut 400.
 */
type StreamPart = { type: string; text?: string; error?: unknown };

const TIMEOUT_ERROR = Object.assign(new Error("timeout"), { name: "TimeoutError" });

/** Prochain morceau de texte du flux, ou une erreur, en ignorant les autres événements. */
const nextText = async (iterator: AsyncIterator<StreamPart>) => {
  while (true) {
    const { value, done } = await iterator.next();
    if (done) return { done: true as const };
    if (value.type === "text-delta" && value.text) return { text: value.text };
    if (value.type === "error") return { error: value.error };
    // Délai dépassé (AbortSignal.timeout) ou appel annulé.
    if (value.type === "abort") return { error: TIMEOUT_ERROR };
  }
};

/**
 * Transforme un flux de texte en réponse HTTP. Une erreur survenue avant le premier
 * morceau (clé refusée, modèle inconnu, délai dépassé…) est renvoyée en JSON (statut 400).
 */
export const streamTextResponse = async (result: { fullStream: AsyncIterable<StreamPart> }) => {
  const iterator = result.fullStream[Symbol.asyncIterator]();
  const encoder = new TextEncoder();

  const first = await nextText(iterator);
  if ("error" in first) {
    console.error("Assistant IA", first.error);
    return Response.json({ error: describeAiError(first.error) }, { status: 400 });
  }
  if (first.done) {
    return Response.json(
      { error: "L'assistant n'a rien répondu. Réessayez, ou choisissez un autre modèle." },
      { status: 400 },
    );
  }

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(encoder.encode(first.text));
    },
    async pull(controller) {
      const next = await nextText(iterator);
      if ("text" in next) {
        controller.enqueue(encoder.encode(next.text));
        return;
      }
      if ("error" in next) console.error("Assistant IA", next.error);
      controller.close();
    },
    cancel() {
      void iterator.return?.();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
};
