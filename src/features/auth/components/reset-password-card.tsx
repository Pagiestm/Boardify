"use client";

import { useState } from "react";
import Link from "next/link";
import { CircleCheckIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { AuthPane } from "./auth-pane";
import { PasswordInput } from "./auth-fields";

interface ResetPasswordCardProps {
  userId?: string;
  secret?: string;
}

/** Choix du nouveau mot de passe, depuis le lien reçu par e-mail. */
export const ResetPasswordCard = ({ userId, secret }: ResetPasswordCardProps) => {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const { mutate, isPending, isSuccess, error } = useMutation({
    mutationFn: async () => {
      const response = await client.api.auth.recovery.confirm.$post({
        json: { userId: userId!, secret: secret!, password },
      });
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) throw new Error(body?.error ?? "Impossible de changer le mot de passe.");
    },
  });

  if (!userId || !secret) {
    return (
      <AuthPane
        title="Lien invalide"
        description="Ce lien de réinitialisation est incomplet. Demandez-en un nouveau."
        footer={
          <Link
            href="/forgot-password"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Recevoir un nouveau lien
          </Link>
        }
      >
        {null}
      </AuthPane>
    );
  }

  if (isSuccess) {
    return (
      <AuthPane
        title="Mot de passe modifié"
        description="Vous pouvez maintenant vous connecter avec votre nouveau mot de passe."
      >
        <div className="flex flex-col gap-4">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <CircleCheckIcon className="size-4 text-primary" />
            Tout est prêt.
          </p>
          <Button asChild className="w-full">
            <Link href="/sign-in">Se connecter</Link>
          </Button>
        </div>
      </AuthPane>
    );
  }

  const tooShort = password.length > 0 && password.length < 8;
  const mismatch = confirm.length > 0 && confirm !== password;

  return (
    <AuthPane title="Nouveau mot de passe" description="Choisissez votre nouveau mot de passe.">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (password.length >= 8 && password === confirm) mutate();
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="new-password">Nouveau mot de passe</Label>
          <PasswordInput
            id="new-password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            aria-invalid={tooShort}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirm-password">Confirmation</Label>
          <PasswordInput
            id="confirm-password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => setConfirm(event.target.value)}
            aria-invalid={mismatch}
          />
        </div>
        <p
          className={
            tooShort || mismatch || error
              ? "text-sm text-destructive"
              : "text-xs text-muted-foreground"
          }
        >
          {error?.message ??
            (mismatch ? "Les deux mots de passe ne correspondent pas." : "8 caractères minimum.")}
        </p>
        <Button
          type="submit"
          disabled={isPending || password.length < 8 || password !== confirm}
          className="w-full"
        >
          {isPending && <Spinner className="text-primary-foreground" />}
          Enregistrer le mot de passe
        </Button>
      </form>
    </AuthPane>
  );
};
