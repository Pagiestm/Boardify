import Link from "next/link";
import { ArrowRightIcon, CheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Reveal } from "./reveal";
import { AppPreview } from "./app-preview";

interface HeroProps {
  isLoggedIn: boolean;
}

const notes = ["Gratuit", "Connexion Google, GitHub ou e-mail", "Clair ou sombre"];

export const Hero = ({ isLoggedIn }: HeroProps) => {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-4 pt-16 pb-16 sm:px-6 sm:pt-24 sm:pb-20">
        <Reveal className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
            Vos projets, clairement organisés.
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-base text-balance text-muted-foreground sm:text-lg">
            Boardify réunit les espaces de travail, les projets et les tâches de votre équipe, avec
            un kanban, un tableau et un calendrier.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isLoggedIn ? (
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href="/dashboard">
                  Ouvrir mon espace
                  <ArrowRightIcon />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link href="/sign-up">
                    Commencer gratuitement
                    <ArrowRightIcon />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href="/sign-in">Se connecter</Link>
                </Button>
              </>
            )}
          </div>
          <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {notes.map((note) => (
              <li key={note} className="flex items-center gap-1.5">
                <CheckIcon className="size-4 text-primary" />
                {note}
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal delay={0.1} className="mt-14 sm:mt-16">
          <AppPreview />
        </Reveal>
      </div>
    </section>
  );
};
