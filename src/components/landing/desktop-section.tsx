import Link from "next/link";
import { FaApple, FaLinux, FaWindows } from "react-icons/fa";
import { BellDotIcon, DownloadIcon, RefreshCwIcon, ZapIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Reveal } from "./reveal";
import { DesktopMockup } from "./desktop-mockup";

const highlights = [
  {
    icon: ZapIcon,
    text: "Ajout rapide d'une tâche depuis n'importe quelle application : ⌃⌥N (Ctrl+Alt+N sous Windows), interprétée par l'assistant IA",
  },
  {
    icon: BellDotIcon,
    text: "Icône dans la barre des menus avec vos tâches du jour, pastille pour les notifications",
  },
  { icon: RefreshCwIcon, text: "Mises à jour automatiques, légère : une dizaine de Mo" },
];

export const DesktopSection = () => {
  return (
    <section id="application" className="scroll-mt-14 border-b bg-muted/30">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Reveal className="flex flex-col items-start">
          <p className="text-sm font-medium text-primary">Application desktop</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Boardify, aussi sur votre bureau
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Retrouvez vos espaces de travail dans une application dédiée, synchronisée avec le site.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {highlights.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-start gap-3 text-sm">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                <span className="pt-1">{text}</span>
              </li>
            ))}
          </ul>
          <div className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3">
            <Button asChild size="lg">
              <Link href="/download">
                <DownloadIcon />
                Télécharger l&apos;application
              </Link>
            </Button>
            <span
              className="flex items-center gap-3 text-muted-foreground"
              aria-label="macOS, Windows et Linux"
            >
              <FaApple className="size-5" />
              <FaWindows className="size-4.5" />
              <FaLinux className="size-5" />
            </span>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <DesktopMockup />
        </Reveal>
      </div>
    </section>
  );
};
