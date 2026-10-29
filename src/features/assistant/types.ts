import { z } from "zod";

export enum AiProvider {
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  MISTRAL = "mistral",
  GOOGLE = "google",
  OPENAI_COMPATIBLE = "openai-compatible",
}

export const AI_PROVIDERS: Record<
  AiProvider,
  { label: string; recommended: string[]; keyUrl?: string; keyHint: string }
> = {
  [AiProvider.OPENAI]: {
    label: "OpenAI",
    recommended: ["gpt-5-mini", "gpt-5", "gpt-4.1-mini"],
    keyUrl: "https://platform.openai.com/api-keys",
    keyHint: "sk-…",
  },
  [AiProvider.ANTHROPIC]: {
    label: "Anthropic (Claude)",
    recommended: ["claude-haiku-4-5", "claude-sonnet-5-5"],
    keyUrl: "https://console.anthropic.com/settings/keys",
    keyHint: "sk-ant-…",
  },
  [AiProvider.MISTRAL]: {
    label: "Mistral",
    recommended: ["mistral-small-latest", "mistral-medium-latest", "mistral-large-latest"],
    keyUrl: "https://console.mistral.ai/api-keys",
    keyHint: "Clé Mistral",
  },
  [AiProvider.GOOGLE]: {
    label: "Google Gemini",
    recommended: ["gemini-flash-lite-latest", "gemini-flash-latest"],
    keyUrl: "https://aistudio.google.com/apikey",
    keyHint: "AIza…",
  },
  [AiProvider.OPENAI_COMPATIBLE]: {
    label: "Compatible OpenAI",
    recommended: [],
    keyHint: "Clé du service",
  },
};

export interface AiModel {
  id: string;
  label: string;
}

/** Liste des modèles : clé saisie, ou à défaut celle enregistrée pour ce fournisseur. */
export const modelsRequestSchema = z.object({
  workspaceId: z.string().min(1),
  provider: z.nativeEnum(AiProvider),
  apiKey: z.string().trim().max(500).optional(),
  baseUrl: z.string().trim().max(500).nullable().optional(),
});

/** Réglages renvoyés au navigateur : la clé n'en fait jamais partie. */
export interface AssistantStatus {
  configured: boolean;
  enabled: boolean;
  canManage: boolean;
  provider: AiProvider | null;
  model: string | null;
  baseUrl: string | null;
  apiKeyHint: string | null;
}

const baseUrlSchema = z
  .string()
  .trim()
  .max(500)
  .url("Adresse invalide")
  .refine((url) => /^https?:\/\//.test(url), "L'adresse doit commencer par http(s)://");

export const assistantSettingsSchema = z
  .object({
    workspaceId: z.string().min(1),
    provider: z.nativeEnum(AiProvider),
    model: z.string().trim().min(1, "Choisissez un modèle").max(100),
    baseUrl: baseUrlSchema.nullable().optional(),
    /** Vide : conserve la clé enregistrée. */
    apiKey: z.string().trim().max(500).optional(),
    enabled: z.boolean().optional(),
  })
  .refine((values) => values.provider !== AiProvider.OPENAI_COMPATIBLE || Boolean(values.baseUrl), {
    path: ["baseUrl"],
    message: "Indiquez l'adresse du service",
  });

export type AssistantSettingsInput = z.infer<typeof assistantSettingsSchema>;

export const MAX_SOURCE_TEXT = 20_000;

export const extractedTaskSchema = z.object({
  name: z.string().describe("Titre court et actionnable, commençant par un verbe"),
  description: z
    .string()
    .nullable()
    .describe("Détails utiles tirés du texte, en texte simple, ou null"),
  dueDate: z
    .string()
    .nullable()
    .describe("Échéance au format AAAA-MM-JJ si le texte en donne une, sinon null"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).describe("Priorité déduite du texte"),
  assignee: z
    .string()
    .nullable()
    .describe("Nom exact d'un membre de la liste fournie si le texte l'attribue, sinon null"),
});

export type ExtractedTask = z.infer<typeof extractedTaskSchema>;

export const taskDraftRequestSchema = z.object({
  workspaceId: z.string().min(1),
  projectId: z.string().min(1).nullable().optional(),
  name: z.string().trim().min(3).max(256),
  description: z.string().max(10000).optional(),
});

export const taskDraftSchema = z.object({
  description: z
    .string()
    .describe(
      "Objectif et contexte de la tâche en deux ou trois phrases, en texte simple, sans lister les étapes (elles vont dans checklist)",
    ),
  checklist: z
    .array(z.string().describe("Sous-tâche courte, commençant par un verbe"))
    .describe("Entre 3 et 6 sous-tâches dans l'ordre de réalisation"),
  priority: z.enum(["HIGH", "MEDIUM", "LOW"]).describe("Priorité probable de la tâche"),
  estimate: z
    .number()
    .int()
    .describe("Estimation de l'effort en points, parmi 1, 2, 3, 5, 8 ou 13"),
});

export type TaskDraft = z.infer<typeof taskDraftSchema>;
