"use client";

import { useState } from "react";
import {
  CalendarPlusIcon,
  CheckIcon,
  CopyIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
} from "lucide-react";

import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useConfirm } from "@/hooks/use-confirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import {
  useCreateCalendarSubscription,
  useDeleteCalendarSubscription,
  useGetCalendarSubscription,
} from "../api/use-calendar-subscription";

export const CalendarSubscriptionButton = () => {
  const workspaceId = useWorkspaceId();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = useGetCalendarSubscription({ workspaceId, enabled: open });
  const { mutate: create, isPending: isCreating } = useCreateCalendarSubscription(workspaceId);
  const { mutate: remove, isPending: isRemoving } = useDeleteCalendarSubscription(workspaceId);

  const [RegenerateDialog, confirmRegenerate] = useConfirm(
    "Régénérer le lien",
    "L'ancien lien cessera de fonctionner dans les calendriers déjà abonnés.",
    "destructive",
  );

  const url = data?.url ?? null;

  const copy = async () => {
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const regenerate = async () => {
    if (await confirmRegenerate()) create();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <RegenerateDialog />
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarPlusIcon />
          S&apos;abonner
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Abonnement au calendrier</DialogTitle>
          <DialogDescription>
            Retrouvez les tâches qui vous sont assignées dans cet espace dans Apple Calendar, Google
            Agenda ou Outlook. Le calendrier se met à jour automatiquement.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <Skeleton className="h-9 w-full" />
        ) : url ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Input
                readOnly
                value={url}
                onFocus={(event) => event.target.select()}
                className="text-muted-foreground"
                aria-label="Lien d'abonnement"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={copy}
                aria-label="Copier le lien"
                className="shrink-0"
              >
                {copied ? <CheckIcon className="text-primary" /> : <CopyIcon />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Ce lien est personnel : toute personne qui le possède peut voir vos tâches. Dans
              Google Agenda, utilisez « Autres agendas → À partir de l&apos;URL ».
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <a href={url.replace(/^https?:/, "webcal:")}>
                  <ExternalLinkIcon />
                  Ouvrir dans Calendrier
                </a>
              </Button>
              <Button size="sm" variant="outline" onClick={regenerate} disabled={isCreating}>
                <RefreshCwIcon />
                Régénérer
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => remove()}
                disabled={isRemoving}
              >
                Désactiver
              </Button>
            </div>
          </div>
        ) : (
          <Button onClick={() => create()} disabled={isCreating} className="self-start">
            <CalendarPlusIcon />
            Créer mon lien d&apos;abonnement
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
