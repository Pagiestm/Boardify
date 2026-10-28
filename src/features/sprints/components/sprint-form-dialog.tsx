"use client";

import { useState } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { DateRangePicker } from "@/components/date-range-picker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Sprint } from "../types";
import { useCreateSprint, useUpdateSprint } from "../api/use-sprints";

export interface SprintFormValues {
  name: string;
  goal: string;
  startDate?: Date;
  endDate?: Date;
}

interface SprintFormDialogProps {
  projectId: string;
  sprint?: Sprint;
  defaultValues: SprintFormValues;
  onClose: () => void;
  onCreated?: (sprintId: string) => void;
}

export const SprintFormDialog = ({
  projectId,
  sprint,
  defaultValues,
  onClose,
  onCreated,
}: SprintFormDialogProps) => {
  const [values, setValues] = useState(defaultValues);
  const { mutate: createSprint, isPending: isCreating } = useCreateSprint();
  const { mutate: updateSprint, isPending: isUpdating } = useUpdateSprint();

  const isValid = values.name.trim() && values.startDate && values.endDate;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!isValid || !values.startDate || !values.endDate) return;

    const json = {
      name: values.name.trim(),
      goal: values.goal.trim(),
      startDate: values.startDate.toISOString(),
      endDate: values.endDate.toISOString(),
    };

    if (sprint) {
      updateSprint({ param: { sprintId: sprint.$id }, json }, { onSuccess: onClose });
    } else {
      createSprint(
        { json: { ...json, projectId } },
        {
          onSuccess: (created) => {
            onCreated?.(created.$id);
            onClose();
          },
        },
      );
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{sprint ? "Modifier le sprint" : "Nouveau sprint"}</DialogTitle>
          <DialogDescription>
            Un sprint regroupe les tâches à livrer sur une période donnée.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="sprint-name">Nom</Label>
            <Input
              id="sprint-name"
              value={values.name}
              maxLength={100}
              autoFocus
              onChange={(event) => setValues({ ...values, name: event.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Période</Label>
            <DateRangePicker
              from={values.startDate}
              to={values.endDate}
              onChange={({ from, to }) => setValues({ ...values, startDate: from, endDate: to })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="sprint-goal">Objectif</Label>
            <Textarea
              id="sprint-goal"
              value={values.goal}
              maxLength={1000}
              rows={3}
              placeholder="Ex. : livrer la nouvelle page de paiement"
              onChange={(event) => setValues({ ...values, goal: event.target.value })}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={!isValid || isCreating || isUpdating}>
              {sprint ? "Enregistrer" : "Créer le sprint"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
