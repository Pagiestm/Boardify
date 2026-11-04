"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon, InboxIcon, RefreshCwIcon } from "lucide-react";

import { useGetMembers } from "@/features/members/api/use-get-members";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { parseBoardColumns } from "@/features/projects/utils";
import { COLUMN_COLOR_CONFIG } from "@/features/projects/constants";
import type { Project } from "@/features/projects/types";

import { cn } from "@/lib/utils";
import { useConfirm } from "@/hooks/use-confirm";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { FormHeader } from "@/components/forms/form-shell";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { INTAKE_INTRO_MAX, INTAKE_TITLE_MAX } from "../schemas";
import {
  useDeleteIntakeForm,
  useGetIntakeForm,
  useRegenerateIntakeToken,
  useSaveIntakeForm,
} from "../api/use-intake";

interface IntakeFormCardProps {
  project: Project;
}

/** Réglages du formulaire public de demande (administrateurs seulement). */
export const IntakeFormCard = ({ project }: IntakeFormCardProps) => {
  const { data, isLoading } = useGetIntakeForm({ projectId: project.$id });

  if (isLoading || !data?.available || !data.canManage) return null;
  return <IntakeFormSettings key={data.form?.token ?? "new"} project={project} form={data.form} />;
};

interface IntakeFormSettingsProps {
  project: Project;
  form: {
    token: string;
    enabled: boolean;
    title: string;
    intro: string;
    assigneeId: string;
    status: string;
  } | null;
}

const IntakeFormSettings = ({ project, form }: IntakeFormSettingsProps) => {
  const columns = parseBoardColumns(project.columnConfig).filter((column) => !column.hidden);
  const { data: members } = useGetMembers({ workspaceId: project.workspaceId });
  const save = useSaveIntakeForm(project.$id);
  const regenerate = useRegenerateIntakeToken(project.$id);
  const remove = useDeleteIntakeForm(project.$id);
  const [copied, setCopied] = useState(false);

  const [title, setTitle] = useState(
    form?.title ?? `Demande pour ${project.name}`.slice(0, INTAKE_TITLE_MAX),
  );
  const [intro, setIntro] = useState(form?.intro ?? "");
  const [assigneeId, setAssigneeId] = useState(form?.assigneeId ?? "");
  const [status, setStatus] = useState(form?.status ?? columns[0]?.id ?? "");
  const [enabled, setEnabled] = useState(form?.enabled ?? true);

  const [RegenerateDialog, confirmRegenerate] = useConfirm(
    "Changer d'adresse",
    "L'adresse actuelle cessera aussitôt de fonctionner : il faudra partager la nouvelle.",
  );
  const [DeleteDialog, confirmDelete] = useConfirm(
    "Supprimer le formulaire",
    "Son adresse cessera de fonctionner. Les tâches déjà reçues sont conservées.",
    "destructive",
  );

  const url =
    form && typeof window !== "undefined" ? `${window.location.origin}/f/${form.token}` : "";
  const isPending = save.isPending || regenerate.isPending || remove.isPending;

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || !assigneeId || !status) return;
    save.mutate({ title: title.trim(), intro: intro.trim(), assigneeId, status, enabled });
  };

  return (
    <Card className="overflow-hidden">
      <RegenerateDialog />
      <DeleteDialog />
      <FormHeader
        title="Formulaire public de demande"
        description="Un lien à partager (clients, testeurs…) : chaque envoi crée une tâche dans ce projet, sans compte Boardify."
      />
      <form onSubmit={handleSubmit} className="flex flex-col gap-5 px-6 pb-6">
        {form && (
          <div className="flex flex-col gap-2 rounded-lg border bg-muted/40 p-3">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <InboxIcon className="size-3.5" />
              {form.enabled
                ? "Adresse publique"
                : "Formulaire désactivé : l'adresse ne répond plus"}
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                readOnly
                value={url}
                aria-label="Adresse publique du formulaire"
                onFocus={(event) => event.target.select()}
                className={cn("font-mono text-xs", !form.enabled && "opacity-60")}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copy}
                  className="flex-1 sm:flex-none"
                >
                  {copied ? <CheckIcon /> : <CopyIcon />}
                  {copied ? "Copiée" : "Copier"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  asChild
                  aria-label="Ouvrir le formulaire"
                >
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <ExternalLinkIcon />
                  </a>
                </Button>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              disabled={isPending}
              className="self-start text-muted-foreground"
              onClick={async () => {
                if (await confirmRegenerate()) regenerate.mutate();
              }}
            >
              <RefreshCwIcon />
              Générer une nouvelle adresse
            </Button>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label htmlFor="intake-title">Titre affiché</Label>
          <Input
            id="intake-title"
            value={title}
            maxLength={INTAKE_TITLE_MAX}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Ex. : Signaler un bug"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="intake-intro">Introduction (facultatif)</Label>
          <Textarea
            id="intake-intro"
            value={intro}
            maxLength={INTAKE_INTRO_MAX}
            onChange={(event) => setIntro(event.target.value)}
            placeholder="Expliquez quoi indiquer et ce qui se passe ensuite."
            rows={3}
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <Label>Assigner les demandes à</Label>
            <Select value={assigneeId} onValueChange={setAssigneeId}>
              <SelectTrigger aria-label="Membre assigné">
                <SelectValue placeholder="Choisir un membre" />
              </SelectTrigger>
              <SelectContent>
                {members?.documents.map((member) => (
                  <SelectItem key={member.$id} value={member.$id}>
                    <MemberAvatar name={member.name} image={member.avatarUrl} className="size-5" />
                    {member.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label>Statut des tâches créées</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger aria-label="Statut">
                <SelectValue placeholder="Choisir un statut" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((column) => (
                  <SelectItem key={column.id} value={column.id}>
                    <span
                      aria-hidden
                      className={cn("size-2 rounded-full", COLUMN_COLOR_CONFIG[column.color].dot)}
                    />
                    {column.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <label className="flex items-start gap-3 text-sm">
          <Checkbox
            checked={enabled}
            onCheckedChange={(checked) => setEnabled(checked === true)}
            className="mt-0.5"
          />
          <span>
            <span className="font-medium">Formulaire actif</span>
            <span className="block text-muted-foreground">
              Désactivé, l&apos;adresse ne répond plus mais les réglages sont conservés.
            </span>
          </span>
        </label>

        <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          {form ? (
            <Button
              type="button"
              variant="ghost"
              disabled={isPending}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              onClick={async () => {
                if (await confirmDelete()) remove.mutate();
              }}
            >
              Supprimer le formulaire
            </Button>
          ) : (
            <span />
          )}
          <Button type="submit" disabled={isPending || !title.trim() || !assigneeId || !status}>
            {save.isPending && <Spinner className="text-primary-foreground" />}
            {form ? "Enregistrer" : "Créer le formulaire"}
          </Button>
        </div>
      </form>
    </Card>
  );
};
