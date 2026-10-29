import { useEffect, useState } from "react";
import { PencilIcon, SparklesIcon } from "lucide-react";

import { useAssistantReady } from "@/features/assistant/api/use-assistant";
import { DescriptionAssistant } from "@/features/assistant/components/description-assistant";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Task } from "../types";
import { useUpdateTask } from "../api/use-update-task";
import { isTypingTarget } from "./task-view-switcher";

interface TaskDescriptionProps {
  task: Task;
}

export const TaskDescription = ({ task }: TaskDescriptionProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(task.description ?? "");
  const [isAssisting, setIsAssisting] = useState(false);
  const assistantReady = useAssistantReady(task.workspaceId);

  const { mutate, isPending } = useUpdateTask();

  const handleSave = () => {
    mutate(
      {
        json: { description: value },
        param: { taskId: task.$id },
      },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  };

  useEffect(() => {
    if (isEditing) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.key !== "i" ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        isTypingTarget(event.target)
      )
        return;
      if (document.querySelector("[role=dialog]")) return;
      event.preventDefault();
      setIsEditing(true);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isEditing]);

  const handleCancel = () => {
    setValue(task.description ?? "");
    setIsEditing(false);
  };

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 border-b py-3">
        <CardTitle className="text-sm">Description</CardTitle>
        {!isEditing && (
          <div className="flex gap-2">
            {assistantReady && !isAssisting && (
              <Button onClick={() => setIsAssisting(true)} size="sm" variant="ghost">
                <SparklesIcon />
                Rédiger avec l&apos;IA
              </Button>
            )}
            <Button
              onClick={() => setIsEditing(true)}
              size="sm"
              variant="outline"
              title="Modifier (i)"
            >
              <PencilIcon />
              Modifier
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 pt-5">
        {isAssisting && !isEditing && (
          <DescriptionAssistant
            taskId={task.$id}
            hasDescription={Boolean(task.description?.trim())}
            isSaving={isPending}
            onClose={() => setIsAssisting(false)}
            onApply={(text, mode) => {
              const description =
                mode === "append" && task.description?.trim()
                  ? `${task.description.trim()}\n\n${text}`
                  : text;
              mutate(
                { json: { description }, param: { taskId: task.$id } },
                {
                  onSuccess: () => {
                    setValue(description);
                    setIsAssisting(false);
                  },
                },
              );
            }}
          />
        )}
        {isEditing ? (
          <div className="flex flex-col gap-3">
            <Textarea
              placeholder="Ajoutez une description : contexte, étapes, liens utiles…"
              value={value}
              rows={10}
              autoFocus
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Escape") handleCancel();
                if (e.key === "s" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault();
                  handleSave();
                }
              }}
              disabled={isPending}
            />
            <div className="flex items-center justify-end gap-2">
              <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isPending}>
                Annuler
              </Button>
              <Button size="sm" onClick={handleSave} disabled={isPending}>
                {isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </div>
        ) : task.description ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.description}</p>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="w-full rounded-md border border-dashed px-4 py-8 text-center text-sm text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground"
          >
            Aucune description. Cliquez pour en ajouter une.
          </button>
        )}
      </CardContent>
    </Card>
  );
};
