"use client";

import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { PageError } from "@/components/page-error";

/**
 * Erreur due à une nouvelle version déployée pendant que la page était ouverte : les fichiers
 * de l'ancienne version n'existent plus. Un rechargement suffit.
 */
const isVersionMismatch = (error: Error) =>
  error.name === "ChunkLoadError" ||
  /loading (css )?chunk|failed to load chunk|dynamically imported module|importing a module script failed|server action/i.test(
    error.message,
  );

const RELOAD_KEY = "boardify:reloaded-for-update";

/** Recharge une seule fois en quelques secondes, pour ne jamais boucler. */
const reloadOnce = () => {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);
    if (Date.now() - last < 10_000) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // Sans stockage, on recharge quand même.
  }
  window.location.reload();
  return true;
};

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const ErrorPage = ({ error, reset }: ErrorPageProps) => {
  const updating = isVersionMismatch(error);

  useEffect(() => {
    if (updating && reloadOnce()) return;
    console.error(error);
  }, [error, updating]);

  if (updating) {
    return (
      <PageError
        className="min-h-screen"
        message="Boardify vient d'être mis à jour"
        description="Rechargez la page pour profiter de la nouvelle version."
      >
        <Button onClick={() => window.location.reload()}>Recharger</Button>
      </PageError>
    );
  }

  return (
    <PageError
      className="min-h-screen"
      message="Quelque chose s'est mal passé"
      description="Une erreur inattendue est survenue. Vous pouvez réessayer ou revenir à l'accueil."
    >
      <Button onClick={() => reset()}>Réessayer</Button>
      <Button variant="outline" asChild>
        <Link href="/dashboard">Retour à l&apos;accueil</Link>
      </Button>
    </PageError>
  );
};

export default ErrorPage;
