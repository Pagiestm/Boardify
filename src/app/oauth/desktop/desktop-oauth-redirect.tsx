"use client";

import { useEffect } from "react";
import { CheckIcon, ExternalLinkIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

interface DesktopOAuthRedirectProps {
  deepLink: string;
}

export const DesktopOAuthRedirect = ({ deepLink }: DesktopOAuthRedirectProps) => {
  useEffect(() => {
    window.location.href = deepLink;
  }, [deepLink]);

  return (
    <div className="flex max-w-sm flex-col items-center text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <CheckIcon className="size-5" />
      </span>
      <h1 className="mt-4 text-xl font-semibold tracking-tight">Connexion réussie</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Retournez dans l&apos;application Boardify. Vous pouvez fermer cet onglet.
      </p>
      <Button asChild className="mt-6">
        <a href={deepLink}>
          <ExternalLinkIcon />
          Ouvrir Boardify
        </a>
      </Button>
    </div>
  );
};
