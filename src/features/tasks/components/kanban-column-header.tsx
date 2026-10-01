"use client";

import { useEffect, useRef, useState } from "react";
import { type DraggableProvidedDragHandleProps } from "@hello-pangea/dnd";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  EyeOffIcon,
  GripVerticalIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
  TrashIcon,
} from "lucide-react";

import { COLUMN_COLOR_CONFIG } from "@/features/projects/constants";
import { BoardColumn, COLUMN_COLORS, ColumnColor } from "@/features/projects/types";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useCreateTaskModal } from "../hooks/use-create-task-modal";

export interface ColumnActions {
  onRename: (label: string) => void;
  onRecolor: (color: ColumnColor) => void;
  onHide: () => void;
  onToggleDone: () => void;
  onDelete: () => void;
  onMove: (direction: -1 | 1) => void;
  canMoveLeft: boolean;
  canMoveRight: boolean;
  canHide: boolean;
  canDelete: boolean;
}

interface KanbanColumnHeaderProps {
  column: BoardColumn;
  taskCount: number;
  actions?: ColumnActions;
  dragHandleProps?: DraggableProvidedDragHandleProps | null;
}

export const KanbanColumnHeader = ({
  column,
  taskCount,
  actions,
  dragHandleProps,
}: KanbanColumnHeaderProps) => {
  const { open } = useCreateTaskModal();
  const [isRenaming, setIsRenaming] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const label = column.label;
  const dot = COLUMN_COLOR_CONFIG[column.color].dot;

  useEffect(() => {
    if (isRenaming) inputRef.current?.select();
  }, [isRenaming]);

  const startRename = () => {
    setDraft(label);
    setIsRenaming(true);
  };

  const commitRename = () => {
    const next = draft.trim();
    if (next.length > 0 && next !== label) actions?.onRename(next.slice(0, 30));
    setIsRenaming(false);
  };

  if (isRenaming) {
    return (
      <div className="flex items-center gap-2 px-1 pb-2">
        <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dot)} />
        <Input
          ref={inputRef}
          value={draft}
          maxLength={30}
          aria-label={`Renommer le statut ${label}`}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commitRename}
          onKeyDown={(event) => {
            if (event.key === "Enter") commitRename();
            if (event.key === "Escape") setIsRenaming(false);
          }}
          className="h-7 text-sm"
        />
      </div>
    );
  }

  return (
    <div className="group/column flex items-center gap-2 px-1 pb-2">
      {dragHandleProps ? (
        <span
          {...dragHandleProps}
          aria-label={`Déplacer le statut ${label}`}
          className="flex cursor-grab items-center text-muted-foreground opacity-0 transition-opacity group-hover/column:opacity-100 focus-visible:opacity-100 active:cursor-grabbing"
        >
          <GripVerticalIcon className="size-3.5" />
        </span>
      ) : null}
      <span aria-hidden className={cn("size-2 shrink-0 rounded-full", dot)} />
      <h2 className="truncate text-sm font-medium">{label}</h2>
      {column.done && (
        <CheckCircleIcon
          aria-label="Statut final"
          className="size-3.5 shrink-0 text-muted-foreground"
        />
      )}
      <span className="text-xs text-muted-foreground tabular-nums">{taskCount}</span>

      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => open(column.id)}
        className="ml-auto size-7 text-muted-foreground"
        aria-label={`Ajouter une tâche dans ${label}`}
      >
        <PlusIcon />
      </Button>

      {actions && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="size-7 text-muted-foreground"
              aria-label={`Personnaliser le statut ${label}`}
            >
              <MoreHorizontalIcon />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={startRename}>
              <PencilIcon className="text-muted-foreground" />
              Renommer
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!actions.canMoveLeft} onClick={() => actions.onMove(-1)}>
              <ArrowLeftIcon className="text-muted-foreground" />
              Déplacer à gauche
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!actions.canMoveRight} onClick={() => actions.onMove(1)}>
              <ArrowRightIcon className="text-muted-foreground" />
              Déplacer à droite
            </DropdownMenuItem>

            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
              Couleur
            </DropdownMenuLabel>
            <div className="flex items-center gap-1 px-2 pb-1.5">
              {COLUMN_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  aria-label={`${COLUMN_COLOR_CONFIG[color].label} pour ${label}`}
                  aria-pressed={column.color === color}
                  onClick={() => actions.onRecolor(color)}
                  className={cn(
                    "size-5 rounded-full",
                    COLUMN_COLOR_CONFIG[color].dot,
                    column.color === color && "outline-2 outline-offset-2 outline-ring",
                  )}
                />
              ))}
            </div>

            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={actions.onToggleDone}>
              <CheckCircleIcon className="text-muted-foreground" />
              {column.done ? "Ne plus clôturer ici" : "Marquer comme statut final"}
            </DropdownMenuItem>
            <DropdownMenuItem disabled={!actions.canHide} onClick={actions.onHide}>
              <EyeOffIcon className="text-muted-foreground" />
              Masquer le statut
            </DropdownMenuItem>
            <DropdownMenuItem
              variant="destructive"
              disabled={!actions.canDelete}
              onClick={actions.onDelete}
            >
              <TrashIcon />
              Supprimer le statut
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};
