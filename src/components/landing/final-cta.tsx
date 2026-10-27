import Link from "next/link";
import { ArrowRightIcon, DownloadIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Reveal } from "./reveal";

interface FinalCtaProps {
  isLoggedIn: boolean;
}

export const FinalCta = ({ isLoggedIn }: FinalCtaProps) => {
  return (
    <section className="border-b bg-muted/40">
      <Reveal className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center sm:px-6">
        <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          Prêt à mettre de l&apos;ordre dans vos projets ?
        </h2>
        <p className="max-w-md text-base text-muted-foreground">
          Créez votre premier espace de travail en moins d&apos;une minute.
        </p>
        <div className="flex w-full flex-col items-center justify-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href={isLoggedIn ? "/dashboard" : "/sign-up"}>
              {isLoggedIn ? "Ouvrir mon espace" : "Commencer gratuitement"}
              <ArrowRightIcon />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
            <Link href="/download">
              <DownloadIcon />
              Télécharger l&apos;application
            </Link>
          </Button>
        </div>
      </Reveal>
    </section>
  );
};
