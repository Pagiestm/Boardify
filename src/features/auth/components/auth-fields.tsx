"use client";

import { useState, useTransition } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { FaGithub } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input, type InputProps } from "@/components/ui/input";
import { signUpWithGithub, signUpWithGoogle } from "@/lib/oauth";

/** Password input with a show/hide toggle. */
export const PasswordInput = ({ className, ...props }: InputProps) => {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} className={cn("pr-10", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
        aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      >
        {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
      </button>
    </div>
  );
};

interface OAuthButtonsProps {
  disabled?: boolean;
}

export const OAuthButtons = ({ disabled }: OAuthButtonsProps) => {
  const [pendingProvider, setPendingProvider] = useState<"google" | "github" | null>(null);
  const [isPending, startTransition] = useTransition();

  const handle = (provider: "google" | "github") => {
    setPendingProvider(provider);
    startTransition(async () => {
      await (provider === "google" ? signUpWithGoogle() : signUpWithGithub());
    });
  };

  const busy = disabled || isPending;

  const providers = [
    { id: "google" as const, label: "Continuer avec Google", icon: FcGoogle },
    { id: "github" as const, label: "Continuer avec GitHub", icon: FaGithub },
  ];

  return (
    <div className="grid gap-2">
      {providers.map(({ id, label, icon: Icon }) => (
        <Button
          key={id}
          type="button"
          variant="outline"
          onClick={() => handle(id)}
          disabled={busy}
          className="w-full"
        >
          {isPending && pendingProvider === id ? <Spinner /> : <Icon className="size-4" />}
          {label}
        </Button>
      ))}
    </div>
  );
};

export const AuthDivider = ({ label = "ou" }: { label?: string }) => (
  <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
    <span className="h-px flex-1 bg-border" />
    {label}
    <span className="h-px flex-1 bg-border" />
  </div>
);
