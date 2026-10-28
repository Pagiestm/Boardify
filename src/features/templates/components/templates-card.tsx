"use client";

import { LayoutTemplateIcon, ListChecksIcon, Trash2Icon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/hooks/use-confirm";

import { useDeleteTemplate, useGetTemplates } from "../api/use-templates";

interface TemplatesCardProps {
  workspaceId: string;
}

export const TemplatesCard = ({ workspaceId }: TemplatesCardProps) => {
  const { data: templates, isLoading } = useGetTemplates({ workspaceId });
  const { mutate: deleteTemplate, isPending } = useDeleteTemplate();

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Supprimer le modèle",
    "Les tâches déjà créées depuis ce modèle ne sont pas modifiées.",
    "destructive",
  );

  const handleDelete = async (templateId: string) => {
    if (await confirmDelete()) deleteTemplate(templateId);
  };

  return (
    <Card>
      <DeleteDialog />
      <div className="space-y-4 p-6">
        <div className="space-y-1">
          <h3 className="flex items-center gap-2 text-base font-semibold">
            <LayoutTemplateIcon className="size-4" />
            Modèles de tâche
          </h3>
          <p className="text-sm text-muted-foreground">
            Enregistrez une tâche comme modèle depuis sa page, puis réutilisez-la à la création.
          </p>
        </div>

        {isLoading ? (
          <Skeleton className="h-10 w-full" />
        ) : templates?.length ? (
          <ul className="divide-y rounded-lg border">
            {templates.map((template) => (
              <li key={template.$id} className="flex items-center gap-3 px-3 py-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{template.name}</span>
                {!!template.data.checklist?.length && (
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <ListChecksIcon className="size-3.5" />
                    {template.data.checklist.length}
                  </span>
                )}
                <Button
                  variant="ghost"
                  size="icon-sm"
                  disabled={isPending}
                  onClick={() => handleDelete(template.$id)}
                  aria-label={`Supprimer le modèle ${template.name}`}
                >
                  <Trash2Icon />
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-muted-foreground">
            Aucun modèle pour l&apos;instant.
          </p>
        )}
      </div>
    </Card>
  );
};
