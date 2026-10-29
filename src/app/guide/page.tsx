import Link from "next/link";
import { BookOpenIcon } from "lucide-react";

import { getCurrent } from "@/features/auth/queries";

import { publicPage } from "@/lib/metadata";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { GuideToc } from "@/components/guide/guide-toc";
import { GUIDE_CHAPTERS } from "@/components/guide/chapters";
import { GuideContent } from "@/components/guide/guide-content";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";

export const metadata = publicPage(
  "Guide d'utilisation",
  "Apprenez à utiliser Boardify : espaces, projets, tâches, sprints, GitHub, assistant IA et application desktop.",
  "/guide",
);

export default async function GuidePage() {
  const isLoggedIn = await getCurrent()
    .then(Boolean)
    .catch(() => false);

  return (
    <div className="min-h-screen overflow-x-clip">
      <LandingHeader isLoggedIn={isLoggedIn} />
      <main>
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 pt-16 pb-14 sm:px-6 sm:pt-20">
            <Reveal className="max-w-2xl">
              <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
                <BookOpenIcon className="size-4" />
                Guide d&apos;utilisation
              </p>
              <h1 className="mt-2 text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
                Tout Boardify, pas à pas.
              </h1>
              <p className="mt-4 text-base text-balance text-muted-foreground sm:text-lg">
                De la création de votre espace à l&apos;assistant IA : chaque fonctionnalité
                expliquée en démo animée, avec les bons boutons et les raccourcis pour aller plus
                vite.
              </p>
            </Reveal>
            <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {GUIDE_CHAPTERS.map(({ id, title, summary, icon: Icon }, index) => (
                <a
                  key={id}
                  href={`#${id}`}
                  className="group flex flex-col gap-2 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="size-4 text-primary" />
                    <span className="text-muted-foreground">{index + 1}.</span>
                    {title}
                  </span>
                  <span className="text-xs leading-relaxed text-muted-foreground">{summary}</span>
                </a>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)] gap-10 px-4 pb-10 sm:px-6 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-16 lg:pt-14">
          <GuideToc />
          <div className="max-w-3xl min-w-0 pt-10 lg:pt-0">
            <GuideContent />
          </div>
        </div>

        <section className="border-t bg-muted/40">
          <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6">
            <h2 className="text-2xl font-semibold tracking-tight">Prêt à vous lancer ?</h2>
            <p className="max-w-md text-muted-foreground">
              Créez votre espace en quelques secondes. Ce guide reste disponible depuis le menu de
              votre compte.
            </p>
            <Button asChild size="lg">
              <Link href={isLoggedIn ? "/dashboard" : "/sign-up"}>
                {isLoggedIn ? "Ouvrir mon espace" : "Commencer gratuitement"}
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
