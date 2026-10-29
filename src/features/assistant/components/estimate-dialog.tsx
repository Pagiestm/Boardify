"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon, SparklesIcon } from "lucide-react";

import { Project } from "@/features/projects/types";

import { client } from "@/lib/rpc";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Checkbox } from "@/components/ui/checkbox";
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

const POINTS = [1, 2, 3, 5, 8, 13];

interface Suggestion {
  taskId: string;
  name: string;
  estimate: number;
  include: boolean;
}

/** Estimation en points, par l'assistant, des tâches ouvertes sans estimation. */
export const EstimateDialog = ({ project, onClose }: { project: Project; onClose: () => void }) => {
  const queryClient = useQueryClient();
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [applied, setApplied] = useState<number | null>(null);

  const { mutate: suggest, isPending } = useMutation({
    mutationFn: async () => {
      const response = await client.api.assistant.projects[":projectId"].estimate.$post({
        param: { projectId: project.$id },
      });
      const body = (await response.json().catch(() => null)) as {
        data?: { suggestions: Omit<Suggestion, "include">[] };
        error?: string;
      } | null;
      if (!response.ok || !body?.data) throw new Error(body?.error ?? "Estimation impossible");
      return body.data.suggestions;
    },
    onSuccess: (items) => setSuggestions(items.map((item) => ({ ...item, include: true }))),
    onError: (error) => toast.error(error.message),
  });

  const { mutate: apply, isPending: isApplying } = useMutation({
    mutationFn: async (items: Suggestion[]) => {
      let count = 0;
      for (const item of items) {
        const response = await client.api.tasks[":taskId"].$patch({
          param: { taskId: item.taskId },
          json: { estimate: item.estimate },
        });
        if (response.ok) count++;
      }
      return count;
    },
    onSuccess: (count) => {
      setApplied(count);
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["task"] });
      queryClient.invalidateQueries({ queryKey: ["sprints"] });
    },
    onError: () => toast.error("Impossible d'enregistrer les estimations"),
  });

  useEffect(() => {
    suggest();
    // Lance l'estimation à l'ouverture uniquement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = suggestions?.filter((item) => item.include) ?? [];
  const total = selected.reduce((sum, item) => sum + item.estimate, 0);
  const update = (index: number, patch: Partial<Suggestion>) =>
    setSuggestions(
      (current) =>
        current?.map((item, position) => (position === index ? { ...item, ...patch } : item)) ??
        null,
    );

  return (
    <Dialog open onOpenChange={(open) => !open && !isApplying && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {applied !== null ? (
              <CheckCircle2Icon className="size-5 text-primary" />
            ) : (
              <SparklesIcon className="size-4" />
            )}
            {applied !== null ? "Estimations enregistrées" : "Estimer les tâches"}
          </DialogTitle>
          <DialogDescription>
            {applied !== null
              ? `${applied} tâche${applied > 1 ? "s" : ""} de ${project.name} ${applied > 1 ? "ont" : "a"} maintenant une estimation.`
              : `Points proposés pour les tâches ouvertes sans estimation de ${project.name}, cohérents avec celles déjà estimées.`}
          </DialogDescription>
        </DialogHeader>

        {applied === null &&
          (isPending || !suggestions ? (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Spinner />
              Estimation en cours…
            </p>
          ) : suggestions.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              Toutes les tâches ouvertes de ce projet ont déjà une estimation.
            </p>
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border">
              {suggestions.map((item, index) => (
                <li key={item.taskId} className="flex items-center gap-3 px-3 py-2">
                  <Checkbox
                    checked={item.include}
                    onCheckedChange={(checked) => update(index, { include: checked === true })}
                    aria-label={`Estimer ${item.name}`}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm">{item.name}</span>
                  <Select
                    value={String(item.estimate)}
                    onValueChange={(value) => update(index, { estimate: Number(value) })}
                  >
                    <SelectTrigger className="h-8 w-24" aria-label="Points">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {POINTS.map((points) => (
                        <SelectItem key={points} value={String(points)}>
                          {points} pts
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </li>
              ))}
            </ul>
          ))}

        <DialogFooter>
          {applied !== null ? (
            <Button onClick={onClose}>Fermer</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose} disabled={isApplying}>
                Annuler
              </Button>
              <Button
                onClick={() => apply(selected)}
                disabled={selected.length === 0 || isApplying}
              >
                {isApplying && <Spinner className="text-current" />}
                Enregistrer {selected.length > 0 ? `(${total} pts)` : ""}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
