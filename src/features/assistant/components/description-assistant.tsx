"use client";

import { useState } from "react";
import { RefreshCwIcon, SparklesIcon, SquareIcon } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useAssistantStream } from "../api/use-assistant";

interface DescriptionAssistantProps {
  taskId: string;
  hasDescription: boolean;
  onApply: (text: string, mode: "replace" | "append") => void;
  onClose: () => void;
  isSaving: boolean;
}

/** Rédaction de la description d'une tâche par l'assistant, affichée en direct. */
export const DescriptionAssistant = ({
  taskId,
  hasDescription,
  onApply,
  onClose,
  isSaving,
}: DescriptionAssistantProps) => {
  const [instructions, setInstructions] = useState("");
  const { text, isStreaming, start, stop } = useAssistantStream();

  const generate = () =>
    start(`/api/assistant/tasks/${taskId}/description`, {
      instructions: instructions.trim() || undefined,
    });

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
      <form
        className="flex gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          generate();
        }}
      >
        <Input
          value={instructions}
          onChange={(event) => setInstructions(event.target.value)}
          maxLength={500}
          placeholder="Consigne facultative : « plus court », « en anglais », « ajoute les tests »…"
          className="bg-background"
          aria-label="Consigne pour l'assistant"
        />
        {isStreaming ? (
          <Button type="button" variant="outline" onClick={stop}>
            <SquareIcon />
            Arrêter
          </Button>
        ) : (
          <Button type="submit">
            {text ? <RefreshCwIcon /> : <SparklesIcon />}
            {text ? "Régénérer" : hasDescription ? "Améliorer" : "Rédiger"}
          </Button>
        )}
      </form>

      {text && (
        <p className="max-h-80 overflow-y-auto rounded-md bg-background p-3 text-sm leading-relaxed whitespace-pre-wrap">
          {text}
          {isStreaming && (
            <span className="ml-0.5 inline-block h-4 w-1.5 animate-pulse bg-primary align-middle" />
          )}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onClose}>
          Fermer
        </Button>
        {text && !isStreaming && (
          <>
            {hasDescription && (
              <Button
                size="sm"
                variant="outline"
                disabled={isSaving}
                onClick={() => onApply(text.trim(), "append")}
              >
                Ajouter à la suite
              </Button>
            )}
            <Button size="sm" disabled={isSaving} onClick={() => onApply(text.trim(), "replace")}>
              {hasDescription ? "Remplacer la description" : "Utiliser cette description"}
            </Button>
          </>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Le titre, la description et les sous-tâches de la tâche sont envoyés au fournisseur
        d&apos;IA de l&apos;espace.
      </p>
    </div>
  );
};
