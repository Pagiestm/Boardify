"use client";

import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon, RefreshCwIcon, SparklesIcon, SquareIcon } from "lucide-react";

import { Project } from "@/features/projects/types";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
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

import { useAssistantStream } from "../api/use-assistant";

/** Met en gras les lignes de titre de section (« Avancement : »). */
export const SummaryText = ({ text }: { text: string }) => (
  <div className="flex flex-col gap-1 text-sm leading-relaxed">
    {text.split("\n").map((line, index) =>
      /^[^-•].{0,40}:\s*$/.test(line.trim()) ? (
        <p key={index} className="mt-2 font-semibold first:mt-0">
          {line.trim()}
        </p>
      ) : line.trim() ? (
        <p key={index} className={line.trim().startsWith("-") ? "pl-3" : undefined}>
          {line}
        </p>
      ) : null,
    )}
  </div>
);

export type SummaryMode = "status" | "report" | "release";

const MODES: Record<SummaryMode, { title: string; description: string }> = {
  status: { title: "Point d'avancement", description: "état actuel des tâches" },
  report: { title: "Bilan de la période", description: "activité de la période" },
  release: { title: "Notes de version", description: "tâches terminées sur la période" },
};

const PERIODS = [
  { value: "7", label: "7 derniers jours" },
  { value: "14", label: "14 derniers jours" },
  { value: "30", label: "30 derniers jours" },
];

interface SummaryDialogProps {
  project: Project;
  sprint?: { $id: string; name: string } | null;
  mode: SummaryMode;
  onClose: () => void;
}

export const SummaryDialog = ({ project, sprint, mode, onClose }: SummaryDialogProps) => {
  const { text, isStreaming, start, stop } = useAssistantStream();
  const [copied, setCopied] = useState(false);
  const [days, setDays] = useState("7");

  const generate = (period = days) =>
    start(`/api/assistant/projects/${project.$id}/summary`, {
      sprintId: mode === "status" ? (sprint?.$id ?? null) : null,
      mode,
      days: Number(period),
    });

  useEffect(() => {
    generate();
    return stop;
    // Génère le texte à l'ouverture uniquement.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const copy = async () => {
    await navigator.clipboard.writeText(text.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const scope =
    mode === "status" && sprint ? `Sprint « ${sprint.name} » de ${project.name}` : project.name;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-4" />
            {MODES[mode].title}
          </DialogTitle>
          <DialogDescription>
            {scope} : {MODES[mode].description}, rédigé par l&apos;assistant.
          </DialogDescription>
        </DialogHeader>

        {mode !== "status" && (
          <Select
            value={days}
            onValueChange={(value) => {
              setDays(value);
              generate(value);
            }}
            disabled={isStreaming}
          >
            <SelectTrigger className="w-full sm:w-56" aria-label="Période">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIODS.map((period) => (
                <SelectItem key={period.value} value={period.value}>
                  {period.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {text ? (
          <SummaryText text={text} />
        ) : (
          <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
            {isStreaming && <Spinner />}
            {isStreaming ? "Analyse des tâches…" : "Rien à afficher pour le moment."}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Fermer
          </Button>
          {isStreaming ? (
            <Button variant="outline" onClick={stop}>
              <SquareIcon />
              Arrêter
            </Button>
          ) : (
            <Button variant="outline" onClick={() => generate()}>
              <RefreshCwIcon />
              Régénérer
            </Button>
          )}
          <Button onClick={copy} disabled={!text || isStreaming}>
            {copied ? <CheckIcon /> : <CopyIcon />}
            {copied ? "Copié" : "Copier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
