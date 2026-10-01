"use client";

import { useState } from "react";
import { CheckIcon, PlusIcon, TrashIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { LABEL_COLORS, type LabelColor } from "../types";
import { LABEL_COLOR_CONFIG, SUGGESTED_LABELS } from "../constants";
import { useGetLabels } from "../api/use-get-labels";
import { useCreateLabel } from "../api/use-create-label";
import { useDeleteLabel } from "../api/use-delete-label";
import { LabelBadge } from "./label-badge";

interface LabelPickerProps {
  workspaceId: string;
  value: string[];
  onChange: (value: string[]) => void;
}

export const LabelPicker = ({ workspaceId, value, onChange }: LabelPickerProps) => {
  const [name, setName] = useState("");
  const [color, setColor] = useState<LabelColor>("teal");

  const { data: labels } = useGetLabels({ workspaceId });
  const { mutate: create, isPending: isCreating } = useCreateLabel();
  const { mutate: remove } = useDeleteLabel();

  const selected = labels?.documents.filter((label) => value.includes(label.$id)) ?? [];

  const toggle = (labelId: string) => {
    onChange(value.includes(labelId) ? value.filter((id) => id !== labelId) : [...value, labelId]);
  };

  const createFromSuggestion = (suggestion: { name: string; color: LabelColor }) => {
    create(
      { json: { name: suggestion.name, color: suggestion.color, workspaceId } },
      { onSuccess: ({ data }) => onChange([...value, data.$id]) },
    );
  };

  const onCreate = () => {
    const trimmed = name.trim();
    if (!trimmed) return;

    create(
      { json: { name: trimmed, color, workspaceId } },
      {
        onSuccess: ({ data }) => {
          setName("");
          onChange([...value, data.$id]);
        },
      },
    );
  };

  return (
    <Popover modal>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex min-h-9 w-full flex-wrap items-center gap-1 rounded-md border border-input bg-background px-3 py-1.5 text-left text-sm shadow-xs transition-colors hover:bg-accent"
        >
          {selected.length === 0 ? (
            <span className="text-muted-foreground">Aucune étiquette</span>
          ) : (
            selected.map((label) => <LabelBadge key={label.$id} label={label} />)
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" role="dialog" aria-label="Étiquettes" className="w-72 p-2">
        <ul className="flex max-h-48 flex-col gap-0.5 overflow-y-auto">
          {labels?.documents.map((label) => {
            const isSelected = value.includes(label.$id);

            return (
              <li key={label.$id} className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => toggle(label.$id)}
                  aria-pressed={isSelected}
                  className="flex flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors hover:bg-accent"
                >
                  <CheckIcon
                    className={cn("size-3.5 shrink-0", isSelected ? "opacity-100" : "opacity-0")}
                  />
                  <LabelBadge label={label} />
                </button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Supprimer l'étiquette ${label.name}`}
                  onClick={() => remove({ param: { labelId: label.$id } })}
                >
                  <TrashIcon className="text-muted-foreground" />
                </Button>
              </li>
            );
          })}
          {labels?.documents.length === 0 && (
            <li className="flex flex-col gap-2 px-2 py-3">
              <p className="text-xs text-muted-foreground">
                Aucune étiquette. Les étiquettes traversent les projets : elles regroupent des
                tâches par nature plutôt que par appartenance.
              </p>
              <div className="flex flex-wrap gap-1">
                {SUGGESTED_LABELS.map((suggestion) => (
                  <button
                    key={suggestion.name}
                    type="button"
                    disabled={isCreating}
                    onClick={() => createFromSuggestion(suggestion)}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-sm px-1.5 py-0.5 text-[11px] font-medium transition-opacity hover:opacity-80 disabled:opacity-50",
                      LABEL_COLOR_CONFIG[suggestion.color].badge,
                    )}
                  >
                    <PlusIcon className="size-2.5" />
                    {suggestion.name}
                  </button>
                ))}
              </div>
            </li>
          )}
        </ul>

        <div className="mt-2 flex flex-col gap-2 border-t pt-2">
          <div className="flex items-center gap-1.5">
            {LABEL_COLORS.map((item) => (
              <button
                key={item}
                type="button"
                aria-label={LABEL_COLOR_CONFIG[item].label}
                aria-pressed={color === item}
                onClick={() => setColor(item)}
                className={cn(
                  "size-5 rounded-full transition-[outline]",
                  LABEL_COLOR_CONFIG[item].dot,
                  color === item && "outline-2 outline-offset-2 outline-ring",
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-1.5">
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Nouvelle étiquette"
              aria-label="Nom de l'étiquette"
              className="h-8"
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onCreate();
                }
              }}
            />
            <Button
              type="button"
              size="icon-sm"
              aria-label="Ajouter l'étiquette"
              disabled={isCreating || name.trim().length === 0}
              onClick={onCreate}
            >
              <PlusIcon />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
