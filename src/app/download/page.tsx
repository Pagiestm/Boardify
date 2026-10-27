import Link from "next/link";
import { headers } from "next/headers";
import { FaApple, FaLinux, FaWindows } from "react-icons/fa";
import {
  DownloadIcon,
  ExternalLinkIcon,
  FeatherIcon,
  LayoutDashboardIcon,
  MousePointerClickIcon,
  RefreshCwIcon,
} from "lucide-react";

import { getCurrent } from "@/features/auth/queries";

import { cn } from "@/lib/utils";
import { publicPage } from "@/lib/metadata";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/landing/reveal";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingFooter } from "@/components/landing/landing-footer";
import { DesktopMockup } from "@/components/landing/desktop-mockup";
import { SectionHeading } from "@/components/landing/section-heading";
import { DesktopPlatform, detectPlatform, getDesktopRelease } from "@/lib/desktop-releases";

export const metadata = publicPage(
  "Application desktop",
  "Téléchargez Boardify pour Mac, Windows et Linux.",
  "/download",
);

const PLATFORMS: Record<
  DesktopPlatform,
  { name: string; icon: React.ComponentType<{ className?: string }>; firstLaunch: string }
> = {
  macos: {
    name: "macOS",
    icon: FaApple,
    firstLaunch:
      "Au premier lancement, si macOS bloque l'application : Réglages Système → Confidentialité et sécurité → « Ouvrir quand même ».",
  },
  windows: {
    name: "Windows",
    icon: FaWindows,
    firstLaunch:
      "Si Windows affiche « Windows a protégé votre ordinateur » : « Informations complémentaires » → « Exécuter quand même ».",
  },
  linux: {
    name: "Linux",
    icon: FaLinux,
    firstLaunch: "Pour l'AppImage, rendez le fichier exécutable (chmod +x) puis lancez-le.",
  },
};

const FEATURES = [
  {
    icon: LayoutDashboardIcon,
    title: "Une vraie application",
    description: "Sa propre fenêtre et son icône dans le Dock ou la barre des tâches.",
  },
  {
    icon: RefreshCwIcon,
    title: "Toujours à jour",
    description: "Chaque nouveauté de Boardify arrive dans l'application, sans la réinstaller.",
  },
  {
    icon: FeatherIcon,
    title: "Légère",
    description: "Une dizaine de Mo, grâce au moteur web déjà présent sur votre système.",
  },
  {
    icon: MousePointerClickIcon,
    title: "Pensée pour le bureau",
    description: "Les liens externes, comme vos issues GitHub, s'ouvrent dans votre navigateur.",
  },
];

export default async function DownloadPage() {
  const [release, userAgent, isLoggedIn] = await Promise.all([
    getDesktopRelease(),
    headers().then((list) => list.get("user-agent")),
    getCurrent()
      .then(Boolean)
      .catch(() => false),
  ]);

  const current = detectPlatform(userAgent);
  const platforms = (Object.keys(PLATFORMS) as DesktopPlatform[]).sort(
    (a, b) => Number(b === current) - Number(a === current),
  );
  const primary = current
    ? release?.downloads.find((download) => download.platform === current)
    : undefined;
  const version = release?.version.replace(/^v/, "");

  return (
    <div className="min-h-screen overflow-x-clip">
      <LandingHeader isLoggedIn={isLoggedIn} />
      <main>
        <section className="border-b">
          <div className="mx-auto max-w-6xl px-4 pt-16 pb-16 sm:px-6 sm:pt-24 sm:pb-20">
            <Reveal className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Boardify, directement sur votre bureau.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base text-balance text-muted-foreground sm:text-lg">
                Vos espaces de travail dans une application dédiée, à portée de clic. Vos données
                restent synchronisées avec le site.
              </p>
              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                {primary && current ? (
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <a href={primary.url}>
                      <DownloadIcon />
                      Télécharger pour {PLATFORMS[current].name}
                    </a>
                  </Button>
                ) : release ? (
                  <Button asChild size="lg" className="w-full sm:w-auto">
                    <a href="#plateformes">
                      <DownloadIcon />
                      Télécharger
                    </a>
                  </Button>
                ) : (
                  <Button size="lg" className="w-full sm:w-auto" disabled>
                    <DownloadIcon />
                    Bientôt disponible
                  </Button>
                )}
                <Button asChild size="lg" variant="outline" className="w-full sm:w-auto">
                  <Link href={isLoggedIn ? "/dashboard" : "/sign-up"}>Continuer sur le site</Link>
                </Button>
              </div>
              <p className="mt-6 text-sm text-muted-foreground">
                {release ? (
                  <>
                    {primary && `${primary.label} · `}Version {version} ·{" "}
                    <a href="#plateformes" className="underline-offset-4 hover:underline">
                      Autres plateformes
                    </a>
                  </>
                ) : (
                  "Pour macOS, Windows et Linux. En attendant, Boardify fonctionne dans votre navigateur."
                )}
              </p>
            </Reveal>
            <Reveal delay={0.1} className="mt-14 sm:mt-16">
              <DesktopMockup />
            </Reveal>
          </div>
        </section>

        <section className="border-b">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-16 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
            {FEATURES.map(({ icon: Icon, title, description }, index) => (
              <Reveal key={title} delay={index * 0.05} className="flex flex-col gap-2">
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="size-4.5" />
                </span>
                <h2 className="font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground">{description}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section id="plateformes" className="scroll-mt-20 bg-muted/40">
          <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-20 sm:px-6">
            <SectionHeading
              eyebrow="Téléchargement"
              title="Choisissez votre plateforme"
              description={
                release ? (
                  <>
                    Version {version} ·{" "}
                    <a
                      href={release.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline-offset-4 hover:underline"
                    >
                      Notes de version
                      <ExternalLinkIcon className="size-3" />
                    </a>
                  </>
                ) : (
                  "Les installateurs seront publiés avec la prochaine version de Boardify."
                )
              }
            />
            <div className="grid gap-4 md:grid-cols-3">
              {platforms.map((platform) => {
                const { name, icon: Icon, firstLaunch } = PLATFORMS[platform];
                const downloads =
                  release?.downloads.filter((download) => download.platform === platform) ?? [];

                return (
                  <Reveal
                    key={platform}
                    className={cn(
                      "flex flex-col gap-4 rounded-xl border bg-card p-5",
                      platform === current && "border-primary ring-1 ring-primary",
                    )}
                  >
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Icon className="size-5" />
                      {name}
                      {platform === current && (
                        <span className="ml-auto rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                          Votre système
                        </span>
                      )}
                    </h3>
                    {downloads.length > 0 ? (
                      <div className="flex flex-col gap-2">
                        {downloads.map((download, index) => (
                          <Button
                            key={download.url}
                            asChild
                            variant={platform === current && index === 0 ? "primary" : "outline"}
                            className="justify-start"
                          >
                            <a href={download.url}>
                              <DownloadIcon />
                              {download.label}
                            </a>
                          </Button>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Bientôt disponible.</p>
                    )}
                    <p className="mt-auto text-xs text-muted-foreground">{firstLaunch}</p>
                  </Reveal>
                );
              })}
            </div>
          </div>
        </section>
      </main>
      <LandingFooter />
    </div>
  );
}
