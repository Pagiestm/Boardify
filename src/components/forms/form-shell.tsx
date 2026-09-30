"use client";

import { ArrowLeftIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

interface FormHeaderProps {
  title: string;
  description?: React.ReactNode;
  onBack?: () => void;
  className?: string;
}

/** Title + description at the top of a form (page card or modal). */
export const FormHeader = ({ title, description, onBack, className }: FormHeaderProps) => {
  return (
    <div className={cn("space-y-1 px-6 pt-6 pr-12 pb-5", className)}>
      {onBack && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          onClick={onBack}
          className="mb-2 -ml-2 text-muted-foreground"
        >
          <ArrowLeftIcon />
          Retour
        </Button>
      )}
      <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
    </div>
  );
};

interface FormFooterProps {
  onCancel?: () => void;
  isPending?: boolean;
  submitLabel: string;
  className?: string;
}

export const FormFooter = ({ onCancel, isPending, submitLabel, className }: FormFooterProps) => {
  return (
    <div
      className={cn(
        "flex flex-col-reverse gap-2 border-t px-6 py-4 sm:flex-row sm:items-center sm:justify-end",
        className,
      )}
    >
      {onCancel && (
        <Button type="button" variant="ghost" onClick={onCancel} disabled={isPending}>
          Annuler
        </Button>
      )}
      <Button disabled={isPending} type="submit">
        {isPending && <Spinner className="text-primary-foreground" />}
        {submitLabel}
      </Button>
    </div>
  );
};

interface DangerZoneProps {
  title?: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  disabled?: boolean;
}

export const DangerZone = ({
  title = "Zone de danger",
  description,
  actionLabel,
  onAction,
  disabled,
}: DangerZoneProps) => {
  return (
    <section className="rounded-lg border border-destructive/30 bg-card shadow-xs">
      <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-destructive">{title}</h3>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button
          type="button"
          variant="destructive"
          disabled={disabled}
          onClick={onAction}
          className="shrink-0"
        >
          {actionLabel}
        </Button>
      </div>
    </section>
  );
};
