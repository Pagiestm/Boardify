"use client";

import { useState } from "react";
import { FaGithub, FaGoogle } from "react-icons/fa";
import { KeyRoundIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useConfirm } from "@/hooks/use-confirm";

import {
  AccountProfile,
  useIdentities,
  useRemoveIdentity,
  useUpdatePassword,
} from "../api/use-account";

const CardHeading = ({ title, description }: { title: string; description: string }) => (
  <div className="space-y-1">
    <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
    <p className="text-sm text-muted-foreground">{description}</p>
  </div>
);

export const PasswordCard = ({ profile }: { profile: AccountProfile }) => {
  const [oldPassword, setOldPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { mutate, isPending } = useUpdatePassword();

  const mismatch = confirm.length > 0 && confirm !== password;
  const tooShort = password.length > 0 && password.length < 8;
  const canSubmit =
    !isPending &&
    password.length >= 8 &&
    password === confirm &&
    (!profile.hasPassword || oldPassword.length > 0);

  return (
    <Card className="gap-0 p-6">
      <CardHeading
        title="Mot de passe"
        description={
          profile.hasPassword
            ? "Changez le mot de passe utilisé pour vous connecter avec votre e-mail."
            : "Vous vous connectez avec Google ou GitHub. Définissez un mot de passe pour aussi vous connecter avec votre e-mail."
        }
      />
      <form
        className="mt-5 flex flex-col gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSubmit) return;
          mutate(
            { password, oldPassword: profile.hasPassword ? oldPassword : undefined },
            {
              onSuccess: () => {
                setOldPassword("");
                setPassword("");
                setConfirm("");
              },
            },
          );
        }}
      >
        {profile.hasPassword && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="old-password">Mot de passe actuel</Label>
            <Input
              id="old-password"
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
              autoComplete="current-password"
            />
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="new-password">Nouveau mot de passe</Label>
            <Input
              id="new-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              aria-invalid={tooShort}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="confirm-password">Confirmation</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              autoComplete="new-password"
              aria-invalid={mismatch}
            />
          </div>
        </div>
        <p
          className={
            tooShort || mismatch ? "text-xs text-destructive" : "text-xs text-muted-foreground"
          }
        >
          {mismatch ? "Les deux mots de passe ne correspondent pas." : "8 caractères minimum."}
        </p>
        <div className="flex justify-end">
          <Button type="submit" disabled={!canSubmit}>
            {isPending && <Spinner className="text-current" />}
            {profile.hasPassword ? "Changer le mot de passe" : "Définir le mot de passe"}
          </Button>
        </div>
      </form>
    </Card>
  );
};

const PROVIDERS: Record<
  string,
  { label: string; icon: React.ComponentType<{ className?: string }> }
> = {
  github: { label: "GitHub", icon: FaGithub },
  google: { label: "Google", icon: FaGoogle },
};

export const IdentitiesCard = () => {
  const { data: identities, isLoading } = useIdentities();
  const { mutate: remove, isPending } = useRemoveIdentity();
  const [ConfirmDialog, confirm] = useConfirm(
    "Délier ce compte",
    "Vous ne pourrez plus vous connecter avec ce compte, sauf en le liant à nouveau.",
    "destructive",
  );

  return (
    <Card className="gap-0 p-6">
      <ConfirmDialog />
      <CardHeading
        title="Comptes liés"
        description="Les comptes Google ou GitHub qui vous permettent de vous connecter."
      />
      <ul className="mt-5 flex flex-col divide-y rounded-lg border">
        {isLoading ? (
          <li className="flex items-center gap-2 px-4 py-3 text-sm text-muted-foreground">
            <Spinner />
            Chargement…
          </li>
        ) : identities && identities.length > 0 ? (
          identities.map((identity) => {
            const provider = PROVIDERS[identity.provider] ?? {
              label: identity.provider,
              icon: KeyRoundIcon,
            };
            const Icon = provider.icon;
            return (
              <li key={identity.id} className="flex items-center gap-3 px-4 py-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{provider.label}</p>
                  <p className="truncate text-xs text-muted-foreground">{identity.email}</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={isPending}
                  className="shrink-0"
                  onClick={async () => {
                    if (await confirm()) remove(identity.id);
                  }}
                >
                  Délier
                </Button>
              </li>
            );
          })
        ) : (
          <li className="px-4 py-3 text-sm text-muted-foreground">
            Aucun compte Google ou GitHub n&apos;est lié : vous vous connectez avec votre e-mail.
          </li>
        )}
      </ul>
    </Card>
  );
};
