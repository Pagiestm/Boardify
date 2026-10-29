"use client";

import { useState } from "react";
import { toast } from "sonner";
import { startOfDay } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon, SparklesIcon, Trash2Icon } from "lucide-react";

import { useGetMembers } from "@/features/members/api/use-get-members";
import { Project } from "@/features/projects/types";
import { TASK_PRIORITY_CONFIG } from "@/features/tasks/constants";
import { TaskPriority } from "@/features/tasks/types";

import { client } from "@/lib/rpc";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/date-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { MAX_SOURCE_TEXT } from "../types";

interface DraftTask {
  include: boolean;
  name: string;
  description: string | null;
  dueDate: Date;
  priority: TaskPriority;
  assigneeId: string;
}

const DEFAULT_DUE_DAYS = 7;

const parseDay = (value: string | null) => {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const readJson = async <T,>(response: Response, fallback: string) => {
  const body = (await response.json().catch(() => null)) as { data?: T; error?: string } | null;
  if (!response.ok || !body?.data) throw new Error(body?.error ?? fallback);
  return body.data;
};

export const ExtractTasksDialog = ({
  project,
  onClose,
}: {
  project: Project;
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const { data: members } = useGetMembers({ workspaceId: project.workspaceId });
  const [text, setText] = useState("");
  const [drafts, setDrafts] = useState<DraftTask[] | null>(null);
  const [created, setCreated] = useState<number | null>(null);

  const update = (index: number, patch: Partial<DraftTask>) =>
    setDrafts(
      (current) =>
        current?.map((draft, position) => (position === index ? { ...draft, ...patch } : draft)) ??
        null,
    );

  const { mutate: extract, isPending: isExtracting } = useMutation({
    mutationFn: async () => {
      const response = await client.api.assistant.projects[":projectId"].extract.$post({
        param: { projectId: project.$id },
        json: { text },
      });
      return readJson<{
        tasks: {
          name: string;
          description: string | null;
          dueDate: string | null;
          priority: TaskPriority;
          assigneeId: string;
        }[];
      }>(response, "L'assistant n'a pas pu analyser ce texte");
    },
    onSuccess: ({ tasks }) => {
      if (tasks.length === 0) {
        toast.info("Aucune tâche trouvée dans ce texte");
        return;
      }
      const fallbackDue = new Date(startOfDay(new Date()).getTime() + DEFAULT_DUE_DAYS * 864e5);
      setDrafts(
        tasks.map((task) => ({
          include: true,
          name: task.name,
          description: task.description,
          dueDate: parseDay(task.dueDate) ?? fallbackDue,
          priority: task.priority,
          assigneeId: task.assigneeId,
        })),
      );
    },
    onError: (error) => toast.error(error.message),
  });

  const selected = drafts?.filter((draft) => draft.include && draft.name.trim()) ?? [];

  const { mutate: create, isPending: isCreating } = useMutation({
    mutationFn: async () => {
      const today = startOfDay(new Date());
      const response = await client.api.assistant.projects[":projectId"].tasks.$post({
        param: { projectId: project.$id },
        json: {
          tasks: selected.map((draft) => ({
            name: draft.name.trim(),
            description: draft.description,
            dueDate: draft.dueDate,
            startDate: draft.dueDate < today ? draft.dueDate : today,
            priority: draft.priority,
            assigneeId: draft.assigneeId,
          })),
        },
      });
      return readJson<{ created: number; failures: { name: string; error: string }[] }>(
        response,
        "Impossible de créer les tâches",
      );
    },
    onSuccess: (result) => {
      setCreated(result.created);
      result.failures.forEach((failure) => toast.error(`${failure.name} : ${failure.error}`));
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["project-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["workspace-analytics"] });
    },
    onError: (error) => toast.error(error.message),
  });

  if (created !== null) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle2Icon className="size-5 text-primary" />
              {created} tâche{created > 1 ? "s" : ""} créée{created > 1 ? "s" : ""}
            </DialogTitle>
            <DialogDescription>Elles sont dans {project.name}.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={onClose}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !isCreating && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4" />
            Créer des tâches depuis un texte
          </DialogTitle>
          <DialogDescription>
            Collez un compte rendu de réunion, un e-mail ou des notes : l&apos;assistant en tire les
            tâches, que vous vérifiez avant de les créer.
          </DialogDescription>
        </DialogHeader>

        {!drafts ? (
          <div className="flex flex-col gap-2">
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              rows={12}
              maxLength={MAX_SOURCE_TEXT}
              autoFocus
              placeholder={
                "Ex. :\nRéunion du 28/10 — Marie s'occupe des maquettes de la page d'accueil pour vendredi. Il faut corriger le bug de connexion en priorité…"
              }
            />
            <p className="text-right text-xs text-muted-foreground">
              {text.length.toLocaleString("fr-FR")} / {MAX_SOURCE_TEXT.toLocaleString("fr-FR")}
            </p>
          </div>
        ) : (
          <ul className="flex flex-col divide-y rounded-lg border">
            {drafts.map((draft, index) => (
              <li key={index} className="flex flex-col gap-2 p-3">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={draft.include}
                    onCheckedChange={(checked) => update(index, { include: checked === true })}
                    aria-label="Créer cette tâche"
                  />
                  <Input
                    value={draft.name}
                    maxLength={256}
                    onChange={(event) => update(index, { name: event.target.value })}
                    className="h-8 font-medium"
                    aria-label="Titre"
                  />
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() =>
                      setDrafts(
                        (current) => current?.filter((_, position) => position !== index) ?? null,
                      )
                    }
                    aria-label="Retirer"
                  >
                    <Trash2Icon />
                  </Button>
                </div>
                {draft.description && (
                  <p className="line-clamp-2 pl-6 text-xs text-muted-foreground">
                    {draft.description}
                  </p>
                )}
                <div className="grid grid-cols-1 gap-2 pl-6 sm:grid-cols-3">
                  <Select
                    value={draft.assigneeId}
                    onValueChange={(value) => update(index, { assigneeId: value })}
                  >
                    <SelectTrigger className="h-8 w-full" aria-label="Assigné">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {members?.documents.map((member) => (
                        <SelectItem key={member.$id} value={member.$id}>
                          {member.name || member.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={draft.priority}
                    onValueChange={(value) => update(index, { priority: value as TaskPriority })}
                  >
                    <SelectTrigger className="h-8 w-full" aria-label="Priorité">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(TaskPriority).map((value) => (
                        <SelectItem key={value} value={value}>
                          Priorité {TASK_PRIORITY_CONFIG[value].label.toLowerCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <DatePicker
                    value={draft.dueDate}
                    onChange={(date) => update(index, { dueDate: startOfDay(date) })}
                    className="h-8"
                  />
                </div>
              </li>
            ))}
          </ul>
        )}

        <DialogFooter>
          {drafts ? (
            <>
              <Button variant="ghost" onClick={() => setDrafts(null)} disabled={isCreating}>
                Modifier le texte
              </Button>
              <Button onClick={() => create()} disabled={selected.length === 0 || isCreating}>
                {isCreating && <Spinner className="text-current" />}
                Créer {selected.length} tâche{selected.length > 1 ? "s" : ""}
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose}>
                Annuler
              </Button>
              <Button onClick={() => extract()} disabled={text.trim().length < 10 || isExtracting}>
                {isExtracting ? <Spinner className="text-current" /> : <SparklesIcon />}
                {isExtracting ? "Analyse…" : "Analyser le texte"}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
