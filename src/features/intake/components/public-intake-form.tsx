"use client";

import { useState } from "react";
import { CheckCircle2Icon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";

import { intakeSubmissionSchema } from "../schemas";
import { useSubmitIntake } from "../api/use-intake";

interface PublicIntakeFormProps {
  token: string;
  title: string;
  intro: string;
}

type Field = "name" | "email" | "title" | "description";

/** Formulaire envoyé par un visiteur sans compte ; chaque envoi devient une tâche. */
export const PublicIntakeForm = ({ token, title, intro }: PublicIntakeFormProps) => {
  const submit = useSubmitIntake(token);
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [sent, setSent] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget)) as Record<string, string>;
    const parsed = intakeSubmissionSchema.safeParse(values);
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as Field;
        next[field] ??= issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    submit.mutate(parsed.data, { onSuccess: () => setSent(true) });
  };

  if (sent) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-10 text-center">
        <CheckCircle2Icon className="size-10 text-primary" />
        <h1 className="text-xl font-semibold tracking-tight">Demande envoyée</h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          Merci ! Votre demande a bien été transmise à l&apos;équipe.
        </p>
        <Button variant="outline" size="sm" className="mt-2" onClick={() => setSent(false)}>
          Envoyer une autre demande
        </Button>
      </Card>
    );
  }

  const error = (field: Field) =>
    errors[field] && (
      <p id={`${field}-error`} className="text-[13px] text-destructive">
        {errors[field]}
      </p>
    );

  return (
    <Card className="overflow-hidden">
      <div className="space-y-2 px-6 pt-6 pb-2">
        <h1 className="text-xl font-semibold tracking-tight break-words">{title}</h1>
        {intro && (
          <p className="text-sm break-words whitespace-pre-line text-muted-foreground">{intro}</p>
        )}
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 px-6 pt-4 pb-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="name">Nom</Label>
            <Input
              id="name"
              name="name"
              autoComplete="name"
              maxLength={100}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? "name-error" : undefined}
            />
            {error("name")}
          </div>
          <div className="flex min-w-0 flex-col gap-2">
            <Label htmlFor="email">E-mail (facultatif)</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              maxLength={200}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {error("email")}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="title">Objet</Label>
          <Input
            id="title"
            name="title"
            maxLength={200}
            placeholder="En une phrase"
            aria-invalid={Boolean(errors.title)}
            aria-describedby={errors.title ? "title-error" : undefined}
          />
          {error("title")}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            name="description"
            rows={6}
            maxLength={5000}
            placeholder="Le contexte, ce que vous attendez, les étapes pour reproduire…"
            aria-invalid={Boolean(errors.description)}
            aria-describedby={errors.description ? "description-error" : undefined}
          />
          {error("description")}
        </div>
        {/* Champ piège : invisible pour un humain, rempli par les robots. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="website">Site web</label>
          <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
        {submit.isError && (
          <p
            role="alert"
            className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {submit.error.message}
          </p>
        )}
        <Button type="submit" disabled={submit.isPending} className="w-full sm:w-auto sm:self-end">
          {submit.isPending && <Spinner className="text-primary-foreground" />}
          Envoyer la demande
        </Button>
      </form>
    </Card>
  );
};
