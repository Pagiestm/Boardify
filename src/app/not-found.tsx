import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-background px-4">
      <Logo />
      <div className="flex max-w-sm flex-col items-center text-center">
        <p className="text-sm font-medium text-primary">Erreur 404</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page introuvable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Cette page n&apos;existe pas ou a été déplacée.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild>
            <Link href="/dashboard">Aller au tableau de bord</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/">Page d&apos;accueil</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
