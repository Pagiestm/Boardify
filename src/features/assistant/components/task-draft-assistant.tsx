"use client";

import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";
import { ListChecksIcon, SparklesIcon, XIcon } from "lucide-react";

import { client } from "@/lib/rpc";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { TaskDraft } from "../types";
import { useAssistantReady } from "../api/use-assistant";

interface TaskDraftAssistantProps {
  workspaceId: string;
  projectId?: string | null;
  name: string;
  description?: string;
  checklist: string[];
  onDraft: (draft: TaskDraft) => void;
  onChecklistChange: (checklist: string[]) => void;
}

/** « Compléter avec l'IA » dans le formulaire de création d'une tâche. */
export const TaskDraftAssistant = ({
  workspaceId,
  projectId,
  name,
  description,
  checklist,
  onDraft,
  onChecklistChange,
}: TaskDraftAssistantProps) => {
  const ready = useAssistantReady(workspaceId);

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async () => {
      const response = await client.api.assistant.draft.$post({
        json: { workspaceId, projectId: projectId || null, name: name.trim(), description },
      });
      const body = (await response.json().catch(() => null)) as {
        data?: TaskDraft;
        error?: string;
      } | null;
      if (!response.ok || !body?.data) {
        throw new Error(body?.error ?? "L'assistant n'a pas pu répondre");
      }
      return body.data;
    },
    onSuccess: (draft) => {
      onDraft(draft);
      toast.success("Tâche complétée par l'assistant : vérifiez avant de créer");
    },
    onError: (error) => toast.error(error.message),
  });

  if (!ready) return null;

  const canDraft = name.trim().length >= 3 && !isPending;

  return (
    <div className="-mt-2 flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!canDraft}
          onClick={() => mutate()}
        >
          {isPending ? <Spinner className="text-current" /> : <SparklesIcon />}
          {isPending ? "Réflexion…" : isSuccess ? "Recompléter avec l'IA" : "Compléter avec l'IA"}
        </Button>
        <span className="text-xs text-muted-foreground">
          {name.trim().length >= 3
            ? "Description, sous-tâches, priorité et estimation à partir du nom."
            : "Saisissez d'abord le nom de la tâche."}
        </span>
      </div>
      {isSuccess && checklist.length > 0 && (
        <div className="flex flex-col gap-1.5 rounded-lg border bg-muted/30 p-3">
          <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ListChecksIcon className="size-3.5" />
            Sous-tâches ajoutées à la création
          </p>
          <ul className="flex flex-col gap-1">
            {checklist.map((item, index) => (
              <li key={`${item}-${index}`} className="group flex items-center gap-2 text-sm">
                <span className="size-1.5 shrink-0 rounded-full bg-muted-foreground/50" />
                <span className="min-w-0 flex-1">{item}</span>
                <button
                  type="button"
                  onClick={() =>
                    onChecklistChange(checklist.filter((_, position) => position !== index))
                  }
                  className="text-muted-foreground opacity-60 transition-opacity hover:text-foreground hover:opacity-100"
                  aria-label={`Retirer « ${item} »`}
                >
                  <XIcon className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
