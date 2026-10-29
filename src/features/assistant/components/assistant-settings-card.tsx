"use client";

import { useState } from "react";
import {
  CheckCircle2Icon,
  ExternalLinkIcon,
  RefreshCwIcon,
  SparklesIcon,
  XCircleIcon,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/hooks/use-confirm";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AI_PROVIDERS, AiProvider, AssistantStatus } from "../types";
import {
  useAssistantModels,
  useAssistantStatus,
  useDeleteAssistant,
  useSaveAssistant,
  useTestAssistant,
} from "../api/use-assistant";

const MIN_KEY_LENGTH = 8;

const AssistantForm = ({
  workspaceId,
  status,
}: {
  workspaceId: string;
  status: AssistantStatus;
}) => {
  const [provider, setProvider] = useState(status.provider ?? AiProvider.MISTRAL);
  const [model, setModel] = useState(status.model ?? "");
  const [baseUrl, setBaseUrl] = useState(status.baseUrl ?? "");
  const [apiKey, setApiKey] = useState("");
  const [enabled, setEnabled] = useState(status.enabled);
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);

  const { mutate: save, isPending: isSaving } = useSaveAssistant(workspaceId);
  const { mutate: remove, isPending: isRemoving } = useDeleteAssistant(workspaceId);
  const { mutate: test, isPending: isTesting } = useTestAssistant();
  const [RemoveDialog, confirmRemove] = useConfirm(
    "Supprimer l'assistant IA",
    "La clé d'API enregistrée sera effacée et les fonctions IA disparaîtront de l'espace.",
    "destructive",
  );

  const config = AI_PROVIDERS[provider];
  const isCompatible = provider === AiProvider.OPENAI_COMPATIBLE;
  const needsKey = !status.configured || provider !== status.provider;
  const debouncedKey = useDebouncedValue(apiKey.trim(), 500);
  const debouncedUrl = useDebouncedValue(baseUrl.trim(), 500);
  const hasKey = debouncedKey.length >= MIN_KEY_LENGTH || !needsKey;

  const {
    data: models,
    error: modelsError,
    isFetching: isLoadingModels,
    refetch: reloadModels,
  } = useAssistantModels({
    workspaceId,
    provider,
    apiKey: debouncedKey,
    baseUrl: isCompatible ? debouncedUrl : null,
    enabled: hasKey && (!isCompatible || /^https?:\/\/\S+/.test(debouncedUrl)),
  });

  // Le modèle enregistré reste proposé même s'il n'apparaît plus dans la liste du fournisseur.
  const options =
    models &&
    status.model &&
    provider === status.provider &&
    !models.some((item) => item.id === status.model)
      ? [{ id: status.model, label: `${status.model} (actuel)` }, ...models]
      : (models ?? []);
  const selectedModel = options.some((item) => item.id === model)
    ? model
    : (config.recommended.find((id) => options.some((item) => item.id === id)) ??
      options[0]?.id ??
      "");

  const values = {
    workspaceId,
    provider,
    model: selectedModel,
    baseUrl: isCompatible ? baseUrl.trim() || null : null,
    apiKey: apiKey.trim() || undefined,
    enabled,
  };
  const canSubmit =
    values.model && (!needsKey || values.apiKey) && (!isCompatible || values.baseUrl);

  const modelPlaceholder = !hasKey
    ? "Collez d'abord la clé d'API"
    : isLoadingModels
      ? "Chargement des modèles…"
      : modelsError
        ? "Modèles indisponibles"
        : "Aucun modèle";

  const changeProvider = (value: AiProvider) => {
    setProvider(value);
    setModel(value === status.provider ? (status.model ?? "") : "");
    setApiKey("");
    setTestResult(null);
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) save(values, { onSuccess: () => setApiKey("") });
      }}
    >
      <RemoveDialog />
      <div className="flex flex-col gap-2">
        <Label>Fournisseur</Label>
        <Select value={provider} onValueChange={(value) => changeProvider(value as AiProvider)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.values(AiProvider).map((value) => (
              <SelectItem key={value} value={value}>
                {AI_PROVIDERS[value].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isCompatible && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="assistant-url">Adresse du service</Label>
          <Input
            id="assistant-url"
            value={baseUrl}
            onChange={(event) => setBaseUrl(event.target.value)}
            placeholder="https://openrouter.ai/api/v1"
          />
          <p className="text-xs text-muted-foreground">
            OpenRouter, Groq… toute API compatible avec celle d&apos;OpenAI.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Label htmlFor="assistant-key">Clé d&apos;API</Label>
        <Input
          id="assistant-key"
          type="password"
          autoComplete="off"
          value={apiKey}
          onChange={(event) => setApiKey(event.target.value)}
          placeholder={
            needsKey
              ? config.keyHint
              : `•••• ${status.apiKeyHint ?? ""} (laisser vide pour conserver)`
          }
        />
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {config.keyUrl && (
            <a
              href={config.keyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
            >
              Obtenir une clé {config.label}
              <ExternalLinkIcon className="size-3" />
            </a>
          )}
          <span>Chiffrée avant d&apos;être enregistrée, jamais réaffichée.</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Modèle</Label>
        <div className="flex gap-2">
          <Select value={selectedModel} onValueChange={setModel} disabled={options.length === 0}>
            <SelectTrigger className="w-full min-w-0 flex-1" aria-label="Modèle">
              <SelectValue placeholder={modelPlaceholder} />
            </SelectTrigger>
            <SelectContent>
              {options.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0"
            disabled={!hasKey || isLoadingModels}
            onClick={() => reloadModels()}
            aria-label="Recharger la liste des modèles"
          >
            {isLoadingModels ? <Spinner className="text-current" /> : <RefreshCwIcon />}
          </Button>
        </div>
        {modelsError ? (
          <p className="text-xs text-destructive">{modelsError.message}</p>
        ) : (
          models && (
            <p className="text-xs text-muted-foreground">
              {models.length} modèle{models.length > 1 ? "s" : ""} disponible
              {models.length > 1 ? "s" : ""} avec cette clé.
            </p>
          )
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={enabled} onCheckedChange={(checked) => setEnabled(checked === true)} />
        Activer l&apos;assistant pour les membres de l&apos;espace
      </label>

      {testResult && (
        <p
          className={
            testResult.ok
              ? "flex items-center gap-2 text-sm text-primary"
              : "flex items-start gap-2 text-sm text-destructive"
          }
        >
          {testResult.ok ? (
            <CheckCircle2Icon className="size-4 shrink-0" />
          ) : (
            <XCircleIcon className="mt-0.5 size-4 shrink-0" />
          )}
          {testResult.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" size="sm" disabled={!canSubmit || isSaving}>
          {isSaving && <Spinner className="text-current" />}
          Enregistrer
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canSubmit || isTesting}
          onClick={() =>
            test(values, {
              onSuccess: (result) =>
                setTestResult(
                  result.ok
                    ? { ok: true, message: "Connexion réussie : le modèle répond." }
                    : { ok: false, message: result.error ?? "Échec du test" },
                ),
            })
          }
        >
          {isTesting && <Spinner className="text-current" />}
          Tester la connexion
        </Button>
        {status.configured && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive"
            disabled={isRemoving}
            onClick={async () => {
              if (await confirmRemove()) remove();
            }}
          >
            Supprimer
          </Button>
        )}
      </div>
    </form>
  );
};

export const AssistantSettingsCard = ({ workspaceId }: { workspaceId: string }) => {
  const { data: status, isLoading } = useAssistantStatus(workspaceId);

  return (
    <Card>
      <div className="space-y-4 p-6">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <SparklesIcon className="size-4" />
            Assistant IA
            {status?.configured && (
              <Badge variant={status.enabled ? "secondary" : "outline"}>
                {status.enabled ? "Activé" : "Désactivé"}
              </Badge>
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            Branchez votre propre IA pour rédiger des descriptions, découper les tâches, créer des
            tâches depuis un texte et résumer l&apos;avancement. Les échanges sont facturés par
            votre fournisseur ; les tâches concernées lui sont envoyées.
          </p>
        </div>

        {isLoading || !status ? (
          <Skeleton className="h-24 w-full" />
        ) : status.canManage ? (
          <AssistantForm
            key={`${status.provider}-${status.model}-${status.configured}`}
            workspaceId={workspaceId}
            status={status}
          />
        ) : (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
            {status.configured
              ? `Assistant fourni par ${AI_PROVIDERS[status.provider!].label} (${status.model}). Seuls les administrateurs peuvent le modifier.`
              : "Aucun assistant configuré. Demandez à un administrateur de l'espace d'en ajouter un."}
          </p>
        )}
      </div>
    </Card>
  );
};
