"use client";

import { useState } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { CompassIcon, MonitorIcon, MoonIcon, SunIcon } from "lucide-react";

import { MemberRole } from "@/features/members/types";
import { resetOnboarding } from "@/features/onboarding/store";
import { WorkspaceAvatar } from "@/features/workspaces/components/workspace-avatar";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DangerZone } from "@/components/forms/form-shell";
import { useConfirm } from "@/hooks/use-confirm";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  AccountProfile,
  useDeleteAccount,
  useLeaveWorkspace,
  useMyWorkspaces,
} from "../api/use-account";

const CardHeading = ({ title, description }: { title: string; description: string }) => (
  <div className="space-y-1">
    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export const WorkspacesCard = () => {
  const { data: workspaces, isLoading } = useMyWorkspaces();
  const { mutate: leave, isPending, variables } = useLeaveWorkspace();
  const [ConfirmDialog, confirm] = useConfirm(
    "Quitter l'espace",
    "Vous n'aurez plus accès à ses projets et à ses tâches, sauf si l'on vous invite à nouveau.",
    "destructive",
  );

  return (
    <Card className="gap-0 p-6">
      <ConfirmDialog />
      <CardHeading
        title="Mes espaces de travail"
        description="Les espaces dont vous êtes membre, et votre rôle dans chacun."
      />
      <ul className="mt-5 flex flex-col divide-y rounded-lg border">
        {isLoading ? (
          <li className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
            <Spinner />
            Chargement…
          </li>
        ) : (
          workspaces?.map((workspace) => (
            <li key={workspace.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <WorkspaceAvatar
                name={workspace.name}
                image={workspace.imageUrl ?? undefined}
                className="size-9"
              />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span className="truncate">{workspace.name}</span>
                  <Badge variant={workspace.role === MemberRole.ADMIN ? "soft" : "secondary"}>
                    {workspace.role === MemberRole.ADMIN ? "Admin" : "Membre"}
                  </Badge>
                </p>
                <p className="text-xs text-muted-foreground">
                  {workspace.leaveBlocker ??
                    `${workspace.memberCount} membre${workspace.memberCount > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="flex gap-1">
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/workspaces/${workspace.id}`}>Ouvrir</Link>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive hover:text-destructive"
                  disabled={
                    Boolean(workspace.leaveBlocker) || (isPending && variables === workspace.id)
                  }
                  title={workspace.leaveBlocker ?? undefined}
                  onClick={async () => {
                    if (await confirm()) leave(workspace.id);
                  }}
                >
                  Quitter
                </Button>
              </div>
            </li>
          ))
        )}
      </ul>
    </Card>
  );
};

const THEMES = [
  { value: "light", label: "Clair", icon: SunIcon },
  { value: "dark", label: "Sombre", icon: MoonIcon },
  { value: "system", label: "Système", icon: MonitorIcon },
];

export const PreferencesCard = ({ profile }: { profile: AccountProfile }) => {
  const { theme, setTheme } = useTheme();
  const [reset, setReset] = useState(false);

  return (
    <Card className="gap-0 p-6">
      <CardHeading title="Préférences" description="L'apparence et l'aide de Boardify." />
      <div className="mt-5 flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">Thème</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Thème">
            {THEMES.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                onClick={() => setTheme(value)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm transition-colors",
                  theme === value
                    ? "border-primary bg-primary/5 font-medium text-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                <Icon className="size-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium">Visites guidées</p>
            <p className="text-sm text-muted-foreground">
              {reset
                ? "Elles se relanceront sur chaque écran, et « Premiers pas » revient sur l'accueil."
                : "Revoir les visites de chaque écran et la carte « Premiers pas »."}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            disabled={reset}
            onClick={() => {
              resetOnboarding(profile.id);
              setReset(true);
            }}
          >
            <CompassIcon />
            {reset ? "C'est fait" : "Revoir les visites"}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export const DeleteAccountCard = ({ profile }: { profile: AccountProfile }) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const { mutate, isPending } = useDeleteAccount();
  const matches = email.trim().toLowerCase() === profile.email.toLowerCase();

  return (
    <>
      <DangerZone
        description="Supprime définitivement votre compte. Les espaces où vous êtes seul sont supprimés avec lui ; vous quittez les autres."
        actionLabel="Supprimer mon compte"
        onAction={() => setOpen(true)}
      />
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (isPending) return;
          setOpen(value);
          if (!value) setEmail("");
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer votre compte ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. Vos espaces où vous êtes seul, avec leurs projets et
              leurs tâches, seront supprimés. Si vous êtes le seul administrateur d&apos;un espace
              partagé, nommez d&apos;abord un autre administrateur.
            </DialogDescription>
          </DialogHeader>
          <form
            id="delete-account"
            className="flex flex-col gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (matches) mutate(email.trim());
            }}
          >
            <label htmlFor="delete-email" className="text-sm">
              Pour confirmer, saisissez <strong className="font-medium">{profile.email}</strong>
            </label>
            <Input
              id="delete-email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="off"
              autoFocus
            />
          </form>
          <DialogFooter>
            <Button variant="ghost" disabled={isPending} onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              form="delete-account"
              variant="destructive"
              disabled={!matches || isPending}
            >
              {isPending && <Spinner className="text-current" />}
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
