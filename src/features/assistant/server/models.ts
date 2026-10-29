import "server-only";

import { AiProvider, AiModel } from "../types";

const TIMEOUT_MS = 15_000;

export class ModelListError extends Error {}

const request = async (url: string, headers: Record<string, string>) => {
  let response: Response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch {
    throw new ModelListError(
      "Impossible de joindre le fournisseur : vérifiez l'adresse du service.",
    );
  }
  const refused =
    response.status === 401 ||
    response.status === 403 ||
    // Google répond 400 « API key not valid » pour une clé invalide.
    (response.status === 400 && /api.?key/i.test(await response.clone().text()));
  if (refused) throw new ModelListError("Clé d'API refusée par le fournisseur.");
  if (!response.ok) {
    throw new ModelListError(`Le fournisseur a répondu par une erreur (${response.status}).`);
  }
  return response.json();
};

// Modèles de texte uniquement : on écarte embeddings, audio, images, modération…
const OPENAI_EXCLUDED =
  /(embedding|whisper|tts|audio|realtime|transcribe|dall-e|image|moderation|search|computer-use|davinci|babbage|instruct)/;

const byNewest = (models: (AiModel & { created?: number })[]) =>
  models
    .sort((a, b) => (b.created ?? 0) - (a.created ?? 0) || a.id.localeCompare(b.id))
    .map(({ id, label }) => ({ id, label }));

const listOpenAI = async (apiKey: string) => {
  const body = (await request("https://api.openai.com/v1/models", {
    Authorization: `Bearer ${apiKey}`,
  })) as { data: { id: string; created?: number }[] };
  return byNewest(
    body.data
      .filter(({ id }) => /^(gpt-|o\d|chatgpt-)/.test(id) && !OPENAI_EXCLUDED.test(id))
      .map(({ id, created }) => ({ id, label: id, created })),
  );
};

const listAnthropic = async (apiKey: string) => {
  const body = (await request("https://api.anthropic.com/v1/models?limit=100", {
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  })) as { data: { id: string; display_name?: string }[] };
  // Déjà triés du plus récent au plus ancien.
  return body.data.map(({ id, display_name }) => ({ id, label: display_name || id }));
};

const listMistral = async (apiKey: string) => {
  const body = (await request("https://api.mistral.ai/v1/models", {
    Authorization: `Bearer ${apiKey}`,
  })) as {
    data: {
      id: string;
      created?: number;
      deprecation?: string | null;
      capabilities?: { completion_chat?: boolean };
    }[];
  };
  return byNewest(
    body.data
      .filter((model) => model.capabilities?.completion_chat !== false && !model.deprecation)
      .filter(({ id }) => !/(embed|moderation|ocr|transcribe)/.test(id))
      .map(({ id, created }) => ({ id, label: id, created })),
  );
};

const listGoogle = async (apiKey: string) => {
  const body = (await request(
    "https://generativelanguage.googleapis.com/v1beta/models?pageSize=1000",
    { "x-goog-api-key": apiKey },
  )) as {
    models: { name: string; displayName?: string; supportedGenerationMethods?: string[] }[];
  };
  return body.models
    .filter(
      (model) =>
        model.supportedGenerationMethods?.includes("generateContent") &&
        /^models\/gemini/.test(model.name) &&
        !/(embedding|image|tts|audio|live)/.test(model.name),
    )
    .map((model) => {
      const id = model.name.replace(/^models\//, "");
      return { id, label: model.displayName ? `${model.displayName} (${id})` : id };
    })
    .sort((a, b) => b.id.localeCompare(a.id));
};

const listCompatible = async (apiKey: string, baseUrl: string) => {
  const body = (await request(`${baseUrl.replace(/\/+$/, "")}/models`, {
    Authorization: `Bearer ${apiKey}`,
  })) as { data?: { id: string; name?: string; created?: number }[] };
  return byNewest(
    (body.data ?? []).map(({ id, name, created }) => ({ id, label: name || id, created })),
  );
};

/** Modèles de texte disponibles avec cette clé, du plus récent au plus ancien. */
export const listModels = async (config: {
  provider: AiProvider;
  apiKey: string;
  baseUrl?: string | null;
}): Promise<AiModel[]> => {
  const models = await (() => {
    switch (config.provider) {
      case AiProvider.OPENAI:
        return listOpenAI(config.apiKey);
      case AiProvider.ANTHROPIC:
        return listAnthropic(config.apiKey);
      case AiProvider.MISTRAL:
        return listMistral(config.apiKey);
      case AiProvider.GOOGLE:
        return listGoogle(config.apiKey);
      case AiProvider.OPENAI_COMPATIBLE:
        if (!config.baseUrl) throw new ModelListError("Indiquez l'adresse du service.");
        return listCompatible(config.apiKey, config.baseUrl);
    }
  })();

  const seen = new Set<string>();
  return models.filter((model) => !seen.has(model.id) && seen.add(model.id)).slice(0, 200);
};
