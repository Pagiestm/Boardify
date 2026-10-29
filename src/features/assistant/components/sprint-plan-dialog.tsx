"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { fr } from "date-fns/locale";
import { format } from "date-fns";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2Icon, SparklesIcon } from "lucide-react";

import { client } from "@/lib/rpc";
import { cn } from "@/lib/utils";
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

interface PlannedTask {
  id: string;
  name: string;
  dueDate: string;
  overdue: boolean;
  priority: string;
  assigneeName: string | null;
  estimate: number | null;
  reason: string;
  include: boolean;
}

/** Tâches du backlog proposées par l'assistant pour un sprint. */
export const SprintPlanDialog = ({
  sprint,
  onClose,
}: {
  sprint: { $id: string; name: string; projectId: string };
  onClose: () => void;
}) => {
  const queryClient = useQueryClient();
  const [plan, setPlan] = useState<{ summary: string; tasks: PlannedTask[] } | null>(null);
  const [added, setAdded] = useState<number | null>(null);

  const { mutate: suggest, isPending } = useMutation({
    mutationFn: async () => {
      const response = await client.api.assistant.sprints[":sprintId"].plan.$post({
        param: { sprintId: sprint.$id },
      });
      const body = (await response.json().catch(() => null)) as {
        data?: { summary: string; suggestions: Omit<PlannedTask, "include">[] };
        error?: string;
      } | null;
      if (!response.ok || !body?.data) throw new Error(body?.error ?? "Planification impossible");
      return body.data;
    },
    onSuccess: (data) =>
      setPlan({
        summary: data.summary,
        tasks: data.suggestions.map((task) => ({ ...task, include: true })),
      }),
    onError: (error) => toast.error(error.message),
  });

  const { mutate: addToSprint, isPending: isAdding } = useMutation({
    mutationFn: async (tasks: PlannedTask[]) => {
      let count = 0;
      for (const task of tasks) {
        const response = await client.api.tasks[":taskId"].$patch({
          param: { taskId: task.id },
          json: { sprintId: sprint.$id },
        });
        if (response.ok) count++;
      }
      return count;
    },
    onSuccess: (count) => {
      setAdded(count);
      queryClient.invalidateQueries({ queryKey: ["sprints", sprint.projectId] });
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => toast.error("Impossible d'ajouter les tâches au sprint"),
  });

  useEffect(() => {
    suggest();
    // Lance la planification à l'ouverture uniquement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = plan?.tasks.filter((task) => task.include) ?? [];
  const points = selected.reduce((sum, task) => sum + (task.estimate ?? 0), 0);

  return (
    <Dialog open onOpenChange={(open) => !open && !isAdding && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {added !== null ? (
              <CheckCircle2Icon className="size-5 text-primary" />
            ) : (
              <SparklesIcon className="size-4" />
            )}
            {added !== null ? "Sprint planifié" : `Planifier « ${sprint.name} »`}
          </DialogTitle>
          <DialogDescription>
            {added !== null
              ? `${added} tâche${added > 1 ? "s" : ""} ajoutée${added > 1 ? "s" : ""} au sprint.`
              : (plan?.summary ??
                "L'assistant choisit dans le backlog les tâches à traiter pendant ce sprint.")}
          </DialogDescription>
        </DialogHeader>

        {added === null &&
          (isPending || !plan ? (
            <p className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
              <Spinner />
              Analyse du backlog et de la charge de l&apos;équipe…
            </p>
          ) : plan.tasks.length === 0 ? (
            <p className="py-6 text-sm text-muted-foreground">
              Aucune tâche du backlog à proposer pour ce sprint.
            </p>
          ) : (
            <ul className="flex flex-col divide-y rounded-lg border">
              {plan.tasks.map((task, index) => (
                <li key={task.id}>
                  <label className="flex items-start gap-3 px-3 py-2.5">
                    <Checkbox
                      className="mt-0.5"
                      checked={task.include}
                      onCheckedChange={(checked) =>
                        setPlan((current) =>
                          current
                            ? {
                                ...current,
                                tasks: current.tasks.map((item, position) =>
                                  position === index
                                    ? { ...item, include: checked === true }
                                    : item,
                                ),
                              }
                            : current,
                        )
                      }
                    />
                    <span className="min-w-0 flex-1 space-y-0.5">
                      <span className="block text-sm font-medium">{task.name}</span>
                      <span className="block text-xs text-muted-foreground">{task.reason}</span>
                      <span className="flex flex-wrap gap-x-2 text-xs text-muted-foreground">
                        {task.assigneeName && <span>{task.assigneeName}</span>}
                        <span className={cn(task.overdue && "text-destructive")}>
                          Échéance {format(new Date(task.dueDate), "d MMM", { locale: fr })}
                        </span>
                        {task.estimate != null && <span>{task.estimate} pts</span>}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          ))}

        <DialogFooter>
          {added !== null ? (
            <Button onClick={onClose}>Fermer</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={onClose} disabled={isAdding}>
                Annuler
              </Button>
              <Button
                onClick={() => addToSprint(selected)}
                disabled={selected.length === 0 || isAdding}
              >
                {isAdding && <Spinner className="text-current" />}
                Ajouter {selected.length} tâche{selected.length > 1 ? "s" : ""}
                {points > 0 ? ` (${points} pts)` : ""}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
