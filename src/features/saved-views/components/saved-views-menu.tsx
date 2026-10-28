"use client";

import { useState } from "react";
import { BookmarkIcon, BookmarkPlusIcon, XIcon } from "lucide-react";

import { useTaskFilters } from "@/features/tasks/hooks/use-task-filters";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useCreateSavedView, useDeleteSavedView, useGetSavedViews } from "../api/use-saved-views";

type TaskView = "table" | "kanban" | "calendar" | "gantt";

interface SavedViewsMenuProps {
  workspaceId: string;
  view: string;
  onViewChange: (view: TaskView) => void;
}

export const SavedViewsMenu = ({ workspaceId, view, onViewChange }: SavedViewsMenuProps) => {
  const [filters, setFilters] = useTaskFilters();
  const [isSaving, setIsSaving] = useState(false);
  const [name, setName] = useState("");
  const { data: savedViews } = useGetSavedViews({ workspaceId });
  const { mutate: createView, isPending } = useCreateSavedView();
  const { mutate: deleteView } = useDeleteSavedView();

  const save = () => {
    if (!name.trim()) return;

    createView(
      {
        json: {
          workspaceId,
          name: name.trim(),
          view: view as TaskView,
          filters: {
            projectId: filters.projectId,
            status: filters.status,
            assigneeId: filters.assigneeId,
            dueDate: filters.dueDate,
            labelId: filters.labelId,
            sprintId: filters.sprintId,
          },
        },
      },
      {
        onSuccess: () => {
          setIsSaving(false);
          setName("");
        },
      },
    );
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="w-full lg:w-auto">
            <BookmarkIcon />
            Vues
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <DropdownMenuLabel>Mes vues</DropdownMenuLabel>
          {savedViews?.length ? (
            savedViews.map((saved) => (
              <DropdownMenuItem
                key={saved.$id}
                onSelect={() => {
                  setFilters({
                    projectId: saved.filters.projectId ?? null,
                    status: saved.filters.status ?? null,
                    assigneeId: saved.filters.assigneeId ?? null,
                    dueDate: saved.filters.dueDate ?? null,
                    labelId: saved.filters.labelId ?? null,
                    sprintId: saved.filters.sprintId ?? null,
                  });
                  onViewChange(saved.view as TaskView);
                }}
              >
                <span className="flex-1 truncate">{saved.name}</span>
                <button
                  type="button"
                  aria-label={`Supprimer la vue ${saved.name}`}
                  className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    deleteView(saved.$id);
                  }}
                >
                  <XIcon className="size-3.5" />
                </button>
              </DropdownMenuItem>
            ))
          ) : (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">Aucune vue enregistrée.</p>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setIsSaving(true)}>
            <BookmarkPlusIcon />
            Enregistrer la vue actuelle…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isSaving} onOpenChange={setIsSaving}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Enregistrer la vue</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Les filtres et la vue actuels seront enregistrés sous ce nom.
          </p>
          <Input
            value={name}
            autoFocus
            maxLength={100}
            placeholder="Ex. : Mes tâches en retard"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") save();
            }}
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsSaving(false)}>
              Annuler
            </Button>
            <Button onClick={save} disabled={isPending || !name.trim()}>
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
