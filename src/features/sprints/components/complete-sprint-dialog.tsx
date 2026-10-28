"use client";

import { useState } from "react";

import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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

import { NO_SPRINT, Sprint, SprintStats } from "../types";
import { useCompleteSprint } from "../api/use-sprints";

interface CompleteSprintDialogProps {
  sprint: Sprint & { stats: SprintStats };
  targets: Sprint[];
  onClose: () => void;
}

export const CompleteSprintDialog = ({ sprint, targets, onClose }: CompleteSprintDialogProps) => {
  const [moveTo, setMoveTo] = useState(targets[0]?.$id ?? NO_SPRINT);
  const { mutate, isPending } = useCompleteSprint();

  const openTasks = sprint.stats.tasks - sprint.stats.doneTasks;

  const submit = () =>
    mutate(
      {
        param: { sprintId: sprint.$id },
        json: { moveTo: moveTo === NO_SPRINT ? null : moveTo },
      },
      { onSuccess: onClose },
    );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Terminer « {sprint.name} »</DialogTitle>
          <DialogDescription>
            {sprint.stats.doneTasks} tâche{sprint.stats.doneTasks > 1 ? "s" : ""} terminée
            {sprint.stats.doneTasks > 1 ? "s" : ""} sur {sprint.stats.tasks}
            {sprint.stats.points > 0 &&
              ` · ${sprint.stats.donePoints}/${sprint.stats.points} points livrés`}
            .
          </DialogDescription>
        </DialogHeader>
        {openTasks > 0 ? (
          <div className="flex flex-col gap-2">
            <Label>
              Reporter les {openTasks} tâche{openTasks > 1 ? "s" : ""} non terminée
              {openTasks > 1 ? "s" : ""} vers
            </Label>
            <Select value={moveTo} onValueChange={setMoveTo}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targets.map((target) => (
                  <SelectItem key={target.$id} value={target.$id}>
                    {target.name}
                  </SelectItem>
                ))}
                <SelectItem value={NO_SPRINT}>Sans sprint</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Toutes les tâches sont terminées.</p>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={isPending}>
            Terminer le sprint
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
