"use client";

import { useState } from "react";

import { BoardColumn } from "@/features/projects/types";
import { COLUMN_COLOR_CONFIG } from "@/features/projects/constants";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ResponsiveModal } from "@/components/responsive-modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DeleteColumnDialogProps {
  column: BoardColumn | null;
  targets: BoardColumn[];
  taskCount: number;
  onCancel: () => void;
  onConfirm: (targetId: string) => void;
}

export const DeleteColumnDialog = ({
  column,
  targets,
  taskCount,
  onCancel,
  onConfirm,
}: DeleteColumnDialogProps) => {
  const [targetId, setTargetId] = useState<string>("");

  if (!column) return null;

  const choice = targetId || targets[0]?.id;

  return (
    <ResponsiveModal
      open={Boolean(column)}
      onopenchange={(open) => {
        if (!open) onCancel();
      }}
      title={`Supprimer le statut ${column.label}`}
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold tracking-tight">
            Supprimer le statut {column.label} ?
          </h2>
          <p className="text-sm text-muted-foreground">
            {taskCount === 0
              ? "Ce statut ne contient aucune tâche."
              : `${taskCount} tâche${taskCount > 1 ? "s" : ""} s'y trouve${taskCount > 1 ? "nt" : ""}. Choisissez où la${taskCount > 1 ? "s" : ""} déplacer.`}
          </p>
        </div>

        {taskCount > 0 && (
          <Select value={choice} onValueChange={setTargetId}>
            <SelectTrigger aria-label="Statut de destination">
              <SelectValue placeholder="Choisir un statut" />
            </SelectTrigger>
            <SelectContent>
              {targets.map((target) => (
                <SelectItem key={target.id} value={target.id}>
                  <span
                    aria-hidden
                    className={cn("size-2 rounded-full", COLUMN_COLOR_CONFIG[target.color].dot)}
                  />
                  {target.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button variant="destructive" disabled={!choice} onClick={() => onConfirm(choice)}>
            Supprimer
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
};
