"use client";

import { useState } from "react";
import Link from "next/link";
import { MailCheckIcon } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { client } from "@/lib/rpc";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { AuthPane } from "./auth-pane";

const BackToSignIn = () => (
  <Link href="/sign-in" className="font-medium text-foreground underline-offset-4 hover:underline">
    Retour à la connexion
  </Link>
);

/** Demande d'un lien pour choisir un nouveau mot de passe. */
export const ForgotPasswordCard = () => {
  const [email, setEmail] = useState("");
  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: async (value: string) => {
      const response = await client.api.auth.recovery.$post({ json: { email: value } });
      if (!response.ok) throw new Error("Impossible d'envoyer le lien. Réessayez.");
    },
  });

  if (isSuccess) {
    return (
      <AuthPane
        title="Vérifiez votre boîte mail"
        description="Si un compte existe pour cette adresse, vous allez recevoir un lien pour choisir un nouveau mot de passe."
        footer={<BackToSignIn />}
      >
        <div className="flex items-start gap-3 rounded-lg border bg-muted/40 p-4 text-sm">
          <MailCheckIcon className="mt-0.5 size-4 shrink-0 text-primary" />
          <p className="text-muted-foreground">
            Envoyé à <strong className="font-medium text-foreground">{email}</strong>. Le lien est
            valable une heure. Pensez à regarder dans les spams.
          </p>
        </div>
      </AuthPane>
    );
  }

  return (
    <AuthPane
      title="Mot de passe oublié"
      description="Saisissez votre adresse e-mail : nous vous envoyons un lien pour en choisir un nouveau."
      footer={<BackToSignIn />}
    >
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (email.trim()) mutate(email.trim());
        }}
      >
        <div className="space-y-2">
          <Label htmlFor="recovery-email">Adresse e-mail</Label>
          <Input
            id="recovery-email"
            type="email"
            required
            autoComplete="email"
            placeholder="vous@exemple.fr"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <Button type="submit" disabled={isPending} className="w-full">
          {isPending && <Spinner className="text-primary-foreground" />}
          Envoyer le lien
        </Button>
      </form>
    </AuthPane>
  );
};
