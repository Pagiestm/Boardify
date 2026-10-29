"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { RefreshCwIcon } from "lucide-react";

import { useCreateChecklistItem } from "@/features/checklist/api/use-checklist";

import { client } from "@/lib/rpc";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";

interface SubtasksAssistantProps {
  taskId: string;
  onClose: () => void;
}

const fetchSuggestions = async (taskId: string) => {
  const response = await client.api.assistant.tasks[":taskId"].subtasks.$post({
    param: { taskId },
  });
  const body = (await response.json().catch(() => null)) as {
    data?: { items: string[] };
    error?: string;
  } | null;
  if (!response.ok || !body?.data)
    throw new Error(body?.error ?? "L'assistant n'a pas pu répondre");
  return body.data.items;
};

/** Sous-tâches proposées par l'assistant, à cocher avant de les ajouter. */
export const SubtasksAssistant = ({ taskId, onClose }: SubtasksAssistantProps) => {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [isAdding, setIsAdding] = useState(false);
  const { mutateAsync: createItem } = useCreateChecklistItem();

  const {
    mutate: suggest,
    data: items,
    isPending,
  } = useMutation({
    mutationFn: () => fetchSuggestions(taskId),
    onSuccess: (result) => setSelected(new Set(result.map((_, index) => index))),
    onError: (error) => toast.error(error.message),
  });

  const add = async () => {
    if (!items) return;
    setIsAdding(true);
    try {
      for (const [index, title] of items.entries()) {
        if (selected.has(index)) await createItem({ json: { taskId, title } });
      }
      onClose();
    } finally {
      setIsAdding(false);
    }
  };

  if (!items) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
        <span className="text-muted-foreground">
          L&apos;assistant propose un découpage de la tâche en étapes.
        </span>
        <div className="flex shrink-0 gap-2">
          <Button size="sm" variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          <Button size="sm" onClick={() => suggest()} disabled={isPending}>
            {isPending && <Spinner className="text-current" />}
            {isPending ? "Réflexion…" : "Proposer"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Aucune nouvelle sous-tâche à proposer pour cette tâche.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((item, index) => (
            <li key={index}>
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  className="mt-0.5"
                  checked={selected.has(index)}
                  onCheckedChange={(checked) =>
                    setSelected((current) => {
                      const next = new Set(current);
                      if (checked === true) next.add(index);
                      else next.delete(index);
                      return next;
                    })
                  }
                />
                {item}
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onClick={onClose} disabled={isAdding}>
          Fermer
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => suggest()}
          disabled={isPending || isAdding}
        >
          {isPending ? <Spinner className="text-current" /> : <RefreshCwIcon />}
          Autres idées
        </Button>
        <Button size="sm" onClick={add} disabled={selected.size === 0 || isAdding}>
          {isAdding && <Spinner className="text-current" />}
          Ajouter {selected.size > 0 ? `(${selected.size})` : ""}
        </Button>
      </div>
    </div>
  );
};
