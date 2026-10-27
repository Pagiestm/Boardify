import { FaGithub } from "react-icons/fa";
import {
  ArrowLeftRightIcon,
  CalendarIcon,
  CircleDotIcon,
  DownloadIcon,
  GitBranchIcon,
  GitPullRequestIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/brand/logo";
import { TaskPriority, TaskStatus } from "@/features/tasks/types";

import { Reveal } from "./reveal";
import { MiniAvatar } from "./preview-data";

const highlights = [
  {
    icon: CircleDotIcon,
    text: "Une issue par tâche, avec ses étiquettes, sa priorité, son assigné et une milestone par projet",
  },
  {
    icon: ArrowLeftRightIcon,
    text: "Synchronisée dans les deux sens : fermer l'issue ou merger la pull request termine la tâche",
  },
  {
    icon: GitBranchIcon,
    text: "Branches et pull requests liées, visibles sur la tâche, et création de branche en un clic",
  },
  { icon: DownloadIcon, text: "Import des issues déjà ouvertes dans le dépôt" },
];

const IssueSidebarRow = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="flex flex-col gap-1.5 border-b py-2.5 last:border-0">
    <p className="text-[11px] font-semibold text-muted-foreground">{title}</p>
    {children}
  </div>
);

const GithubSyncPreview = () => (
  <div aria-hidden className="relative mx-auto w-full max-w-xl select-none">
    <div className="absolute inset-[10%] -z-10 rounded-full bg-primary/20 blur-3xl dark:bg-primary/10" />

    <div className="relative w-[80%] rounded-xl border bg-card p-4 shadow-lg shadow-black/5">
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <LogoMark className="size-4" />
          Boardify
        </span>
        <Badge variant={TaskStatus.IN_PROGRESS} dot>
          En cours
        </Badge>
      </div>
      <p className="mt-3 text-sm font-semibold">Intégration du paiement</p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
        <Badge variant={TaskPriority.HIGH}>Haute</Badge>
        <span className="rounded-md bg-blue-50 px-1.5 py-0.5 font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
          évolution
        </span>
        <span className="flex items-center gap-1">
          <CalendarIcon className="size-3" />6 → 12 oct.
        </span>
        <MiniAvatar name="Sam" className="ml-auto" />
      </div>
      <div className="mt-3 flex items-center gap-1.5 border-t pt-3 text-xs text-muted-foreground">
        <FaGithub className="size-3.5 text-foreground" />
        Issue #42 · studio-nova/app-mobile
      </div>
    </div>

    <div className="relative z-10 -my-3 ml-[12%] flex w-fit items-center gap-1.5 rounded-full border bg-background px-3 py-1 text-xs font-medium shadow-sm">
      <ArrowLeftRightIcon className="size-3.5 text-primary" />
      Synchronisé
    </div>

    <div className="relative ml-auto w-[88%] rounded-xl border bg-card shadow-xl shadow-black/10">
      <div className="border-b px-4 py-3">
        <p className="text-sm font-semibold">
          Intégration du paiement <span className="font-normal text-muted-foreground">#42</span>
        </p>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1 rounded-full bg-[#1f883d] px-2 py-0.5 font-medium text-white">
            <CircleDotIcon className="size-3" />
            Open
          </span>
          <LogoMark className="size-3.5" />
          <span>
            <span className="font-medium text-foreground">boardify[bot]</span> opened this issue
          </span>
        </div>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] gap-4 px-4 py-1">
        <div className="flex flex-col gap-2 py-3">
          <span className="h-2 w-full rounded-full bg-muted" />
          <span className="h-2 w-5/6 rounded-full bg-muted" />
          <span className="h-2 w-2/3 rounded-full bg-muted" />
          <span className="mt-2 text-[11px] text-muted-foreground">
            Statut : En cours · Période : 6 → 12 oct.
          </span>
        </div>
        <div className="border-l pl-3">
          <IssueSidebarRow title="Assignees">
            <span className="flex items-center gap-1.5 text-[11px] font-medium">
              <MiniAvatar name="Sam" className="size-4 text-[8px]" />
              sam-dev
            </span>
          </IssueSidebarRow>
          <IssueSidebarRow title="Labels">
            <span className="flex flex-wrap gap-1">
              <span className="rounded-full bg-[#3b82f6] px-1.5 py-px text-[10px] font-medium text-white">
                évolution
              </span>
              <span className="rounded-full bg-[#d73a4a] px-1.5 py-px text-[10px] font-medium text-white">
                priorité : haute
              </span>
            </span>
          </IssueSidebarRow>
          <IssueSidebarRow title="Milestone">
            <span className="text-[11px] font-medium">App mobile</span>
            <span className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <span className="block h-full w-3/5 rounded-full bg-[#1f883d]" />
            </span>
          </IssueSidebarRow>
          <IssueSidebarRow title="Development">
            <span className="flex items-center gap-1 truncate text-[11px]">
              <GitBranchIcon className="size-3 shrink-0" />
              42-integration-du-paiement
            </span>
            <span className="flex items-center gap-1 text-[11px]">
              <GitPullRequestIcon className="size-3 shrink-0 text-[#1f883d]" />
              #57 Paiement Stripe
            </span>
          </IssueSidebarRow>
        </div>
      </div>
    </div>
  </div>
);

export const GithubSection = () => {
  return (
    <section id="github" className="scroll-mt-14 border-b">
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        <Reveal delay={0.1} className="order-last lg:order-first">
          <GithubSyncPreview />
        </Reveal>
        <Reveal className="flex flex-col items-start">
          <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
            <FaGithub className="size-4" />
            Intégration GitHub
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Vos tâches et vos issues, toujours alignées
          </h2>
          <p className="mt-4 text-base text-muted-foreground">
            Connectez votre compte ou votre organisation GitHub, liez un dépôt à chaque projet :
            Boardify tient les issues à jour pendant que vous avancez.
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
          <p className="mt-6 text-xs text-muted-foreground">
            Via une GitHub App : vous choisissez les dépôts auxquels Boardify a accès.
          </p>
        </Reveal>
      </div>
    </section>
  );
};
