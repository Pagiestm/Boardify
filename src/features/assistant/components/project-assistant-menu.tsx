"use client";

import {
  CalculatorIcon,
  ClipboardListIcon,
  FileTextIcon,
  MegaphoneIcon,
  SparklesIcon,
  TextCursorInputIcon,
} from "lucide-react";

import { Project } from "@/features/projects/types";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { EstimateDialog } from "./estimate-dialog";
import { SummaryDialog, SummaryMode } from "./summary-dialog";
import { ExtractTasksDialog } from "./extract-tasks-dialog";

export type ProjectAssistantAction = SummaryMode | "extract" | "estimate";

/** Menu « Assistant » de la page d'un projet. */
export const ProjectAssistantMenu = ({
  onSelect,
}: {
  onSelect: (action: ProjectAssistantAction) => void;
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <SparklesIcon />
        Assistant
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="w-60">
      <DropdownMenuLabel className="text-xs text-muted-foreground">Rédiger</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => onSelect("status")}>
        <FileTextIcon />
        Point d&apos;avancement
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onSelect("report")}>
        <ClipboardListIcon />
        Bilan de la période
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onSelect("release")}>
        <MegaphoneIcon />
        Notes de version
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuLabel className="text-xs text-muted-foreground">Tâches</DropdownMenuLabel>
      <DropdownMenuItem onClick={() => onSelect("extract")}>
        <TextCursorInputIcon />
        Créer depuis un texte
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => onSelect("estimate")}>
        <CalculatorIcon />
        Estimer les tâches
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export const ProjectAssistantDialog = ({
  action,
  project,
  sprint,
  onClose,
}: {
  action: ProjectAssistantAction;
  project: Project;
  sprint: { $id: string; name: string } | null;
  onClose: () => void;
}) => {
  if (action === "extract") return <ExtractTasksDialog project={project} onClose={onClose} />;
  if (action === "estimate") return <EstimateDialog project={project} onClose={onClose} />;
  return <SummaryDialog project={project} sprint={sprint} mode={action} onClose={onClose} />;
};
