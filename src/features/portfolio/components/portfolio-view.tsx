"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { fr } from "date-fns/locale";
import { format } from "date-fns";
import {
  AlertTriangleIcon,
  CalendarIcon,
  FlagIcon,
  HistoryIcon,
  InfoIcon,
  SearchIcon,
  type LucideIcon,
} from "lucide-react";

import { SPRINT_STATE_LABELS } from "@/features/sprints/types";
import { ProjectAvatar } from "@/features/projects/components/project-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TimeAgo } from "@/components/time-ago";
import { PageError } from "@/components/page-error";
import { PageLoader } from "@/components/page-loader";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { HEALTH_CONFIG } from "../constants";
import { usePortfolio } from "../api/use-portfolio";
import { HEALTH_ORDER, type PortfolioProject, type ProjectHealth } from "../portfolio";

type SortKey = "health" | "progress" | "due" | "activity" | "name";

const SORTS: Record<
  SortKey,
  { label: string; compare: (a: PortfolioProject, b: PortfolioProject) => number }
> = {
  health: {
    label: "Santé",
    compare: (a, b) =>
      HEALTH_ORDER.indexOf(a.health) - HEALTH_ORDER.indexOf(b.health) ||
      b.tasks.overdue - a.tasks.overdue,
  },
  progress: { label: "Avancement", compare: (a, b) => b.progress - a.progress },
  due: {
    label: "Prochaine échéance",
    compare: (a, b) => (a.nextDue ?? "9999").localeCompare(b.nextDue ?? "9999"),
  },
  activity: {
    label: "Activité récente",
    compare: (a, b) => b.lastActivity.localeCompare(a.lastActivity),
  },
  name: { label: "Nom", compare: (a, b) => a.name.localeCompare(b.name, "fr") },
};

const ALL = "all";

const percent = (value: number) => `${Math.round(value * 100)} %`;

const ProgressBar = ({ value, className }: { value: number; className?: string }) => (
  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
    <div
      className={cn("h-full rounded-full transition-all", className)}
      style={{ width: `${Math.round(Math.min(1, Math.max(0, value)) * 100)}%` }}
    />
  </div>
);

const Stat = ({
  icon: Icon,
  label,
  children,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  children: React.ReactNode;
  tone?: "warning";
}) => (
  <div className="flex min-w-0 flex-col gap-0.5">
    <dt className="flex items-center gap-1 text-[11px] text-muted-foreground">
      <Icon className="size-3" />
      {label}
    </dt>
    <dd
      className={cn(
        "truncate text-sm font-medium tabular-nums",
        tone === "warning" && "text-rose-700 dark:text-rose-400",
      )}
    >
      {children}
    </dd>
  </div>
);

const HealthHelp = () => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="sm" className="text-muted-foreground">
        <InfoIcon />
        Calcul de la santé
      </Button>
    </PopoverTrigger>
    <PopoverContent align="end" collisionPadding={12} className="w-80 text-sm">
      <p className="font-medium">Comment la santé est calculée</p>
      <ul className="mt-2 flex flex-col gap-2 text-muted-foreground">
        <li>
          <span className="font-medium text-rose-700 dark:text-rose-400">En retard</span> : le
          sprint en cours a dépassé sa date de fin, ou au moins 3 tâches ouvertes (et un quart
          d&apos;entre elles) ont dépassé leur échéance.
        </li>
        <li>
          <span className="font-medium text-amber-700 dark:text-amber-400">À surveiller</span> : au
          moins une tâche en retard, ou un sprint qui avance nettement moins vite que le temps
          écoulé.
        </li>
        <li>
          <span className="font-medium text-primary">En bonne voie</span> : aucune tâche en retard
          et un sprint dans les temps.
        </li>
      </ul>
      <p className="mt-2 text-xs text-muted-foreground">
        L&apos;avancement est compté en points quand les tâches sont estimées, sinon en tâches.
      </p>
    </PopoverContent>
  </Popover>
);

const ProjectCard = ({
  project,
  workspaceId,
}: {
  project: PortfolioProject;
  workspaceId: string;
}) => {
  const health = HEALTH_CONFIG[project.health];
  const usePoints = project.points.total > 0;
  const sprint = project.sprint;

  return (
    <article className="flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-4 shadow-xs">
      <header className="flex items-start justify-between gap-3">
        <Link
          href={`/workspaces/${workspaceId}/projects/${project.id}`}
          className="flex min-w-0 items-center gap-2.5 hover:underline"
        >
          <ProjectAvatar
            name={project.name}
            image={project.imageUrl ?? undefined}
            className="size-8"
            fallbackClassName="text-sm"
          />
          <h2 className="truncate font-semibold">{project.name}</h2>
        </Link>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium",
            health.badge,
          )}
        >
          <span aria-hidden className={cn("size-1.5 rounded-full", health.dot)} />
          {health.label}
        </span>
      </header>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-3">
          <ProgressBar value={project.progress} className="bg-primary" />
          <span className="text-xs font-medium tabular-nums">{percent(project.progress)}</span>
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {project.tasks.done}/{project.tasks.total} tâche{project.tasks.total > 1 ? "s" : ""}{" "}
          terminée{project.tasks.total > 1 ? "s" : ""}
          {usePoints && ` · ${project.points.done}/${project.points.total} points`}
        </p>
      </div>

      <dl className="grid grid-cols-3 gap-3">
        <Stat
          icon={AlertTriangleIcon}
          label="En retard"
          tone={project.tasks.overdue > 0 ? "warning" : undefined}
        >
          {project.tasks.overdue}
        </Stat>
        <Stat icon={CalendarIcon} label="Échéance">
          {project.nextDue ? format(new Date(project.nextDue), "d MMM", { locale: fr }) : "—"}
        </Stat>
        <Stat icon={HistoryIcon} label="Activité">
          <TimeAgo date={project.lastActivity} className="text-xs" />
        </Stat>
      </dl>

      {sprint && (
        <div className="flex flex-col gap-1.5 rounded-md bg-muted/50 p-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <span className="flex min-w-0 items-center gap-1.5 font-medium">
              <FlagIcon className="size-3 shrink-0 text-muted-foreground" />
              <span className="truncate">{sprint.name}</span>
            </span>
            <span
              className={cn(
                "shrink-0 text-muted-foreground",
                sprint.state === "late" && "text-amber-700 dark:text-amber-400",
              )}
            >
              {SPRINT_STATE_LABELS[sprint.state]}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <ProgressBar value={sprint.progress} className="bg-primary" />
            <span className="text-xs tabular-nums">{percent(sprint.progress)}</span>
          </div>
          <p className="text-[11px] text-muted-foreground tabular-nums">
            {format(new Date(sprint.startDate), "d MMM", { locale: fr })} →{" "}
            {format(new Date(sprint.endDate), "d MMM", { locale: fr })}
            {sprint.state === "active" && ` · ${percent(sprint.elapsed)} du temps écoulé`}
          </p>
        </div>
      )}

      <ul className="flex flex-col gap-1 border-t pt-3 text-xs text-muted-foreground">
        {project.reasons.map((reason) => (
          <li key={reason} className="flex gap-1.5">
            <span aria-hidden className={cn("mt-1.5 size-1 shrink-0 rounded-full", health.dot)} />
            {reason}
          </li>
        ))}
      </ul>
    </article>
  );
};

/** Vue d'ensemble de tous les projets de l'espace : avancement, retards, sprint et santé. */
export const PortfolioView = () => {
  const workspaceId = useWorkspaceId();
  const { data: projects, isLoading } = usePortfolio(workspaceId);
  const [search, setSearch] = useState("");
  const [health, setHealth] = useState<ProjectHealth | typeof ALL>(ALL);
  const [sort, setSort] = useState<SortKey>("health");

  const counts = useMemo(() => {
    const result = Object.fromEntries(HEALTH_ORDER.map((key) => [key, 0])) as Record<
      ProjectHealth,
      number
    >;
    for (const project of projects ?? []) result[project.health] += 1;
    return result;
  }, [projects]);

  const visible = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("fr");
    return (projects ?? [])
      .filter((project) => health === ALL || project.health === health)
      .filter((project) => !query || project.name.toLocaleLowerCase("fr").includes(query))
      .sort(SORTS[sort].compare);
  }, [projects, search, health, sort]);

  if (isLoading) return <PageLoader />;
  if (!projects) return <PageError message="Impossible de charger le portefeuille" />;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-tight">Portefeuille</h1>
          <p className="text-sm text-muted-foreground">
            L&apos;avancement et la santé de tous les projets de l&apos;espace.
          </p>
        </div>
        <HealthHelp />
      </div>

      {projects.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {(["off-track", "at-risk", "on-track", "done"] as ProjectHealth[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setHealth((current) => (current === key ? ALL : key))}
              aria-pressed={health === key}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-2.5 text-left shadow-xs transition-colors hover:bg-accent",
                health === key && "border-primary ring-1 ring-primary",
              )}
            >
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <span
                  aria-hidden
                  className={cn("size-2 shrink-0 rounded-full", HEALTH_CONFIG[key].dot)}
                />
                <span className="truncate">{HEALTH_CONFIG[key].label}</span>
              </span>
              <span className="text-lg font-semibold tabular-nums">{counts[key]}</span>
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:max-w-xs sm:flex-1">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher un projet"
            aria-label="Rechercher un projet"
            className="pl-8"
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <Select value={health} onValueChange={(value) => setHealth(value as ProjectHealth)}>
            <SelectTrigger className="w-full sm:w-44" aria-label="Filtrer par santé">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toutes les santés</SelectItem>
              {HEALTH_ORDER.map((key) => (
                <SelectItem key={key} value={key}>
                  {HEALTH_CONFIG[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sort} onValueChange={(value) => setSort(value as SortKey)}>
            <SelectTrigger className="w-full sm:w-48" aria-label="Trier">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(SORTS) as SortKey[]).map((key) => (
                <SelectItem key={key} value={key}>
                  Tri : {SORTS[key].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {visible.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visible.map((project) => (
            <ProjectCard key={project.id} project={project} workspaceId={workspaceId} />
          ))}
        </div>
      ) : (
        <p className="rounded-lg border border-dashed px-4 py-10 text-center text-sm text-muted-foreground">
          {projects.length === 0
            ? "Aucun projet dans cet espace pour le moment."
            : "Aucun projet ne correspond à ces filtres."}
        </p>
      )}
    </div>
  );
};
