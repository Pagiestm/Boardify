"use client";

import { LayoutTemplateIcon, ListChecksIcon } from "lucide-react";

import { cn } from "@/lib/utils";

import { useGetTemplates } from "../api/use-templates";
import { TemplateData } from "../types";

interface TemplatePickerProps {
  workspaceId: string;
  selectedId: string | null;
  checklistCount: number;
  onSelect: (templateId: string | null, data: TemplateData) => void;
}

export const TemplatePicker = ({
  workspaceId,
  selectedId,
  checklistCount,
  onSelect,
}: TemplatePickerProps) => {
  const { data: templates } = useGetTemplates({ workspaceId });

  if (!templates?.length) return null;

  return (
    <div className="flex flex-col gap-2 px-6 pb-5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <LayoutTemplateIcon className="size-3.5" />
        Partir d&apos;un modèle
      </div>
      <div className="flex flex-wrap gap-1.5">
        {templates.map((template) => {
          const isSelected = template.$id === selectedId;
          return (
            <button
              key={template.$id}
              type="button"
              aria-pressed={isSelected}
              onClick={() =>
                isSelected ? onSelect(null, {}) : onSelect(template.$id, template.data)
              }
              className={cn(
                "rounded-md border px-2.5 py-1 text-xs transition-colors",
                isSelected
                  ? "border-primary bg-primary/10 text-primary"
                  : "bg-muted/40 hover:bg-accent",
              )}
            >
              {template.name}
            </button>
          );
        })}
      </div>
      {checklistCount > 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ListChecksIcon className="size-3.5" />
          {checklistCount} sous-tâche{checklistCount > 1 ? "s" : ""} seront ajoutées
        </p>
      )}
    </div>
  );
};
