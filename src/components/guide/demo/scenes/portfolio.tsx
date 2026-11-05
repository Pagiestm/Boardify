import {
  AlertTriangleIcon,
  CalendarIcon,
  ChevronsUpDownIcon,
  FlagIcon,
  HistoryIcon,
  InfoIcon,
  SearchIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { HEALTH_CONFIG } from "@/features/portfolio/constants";
import type { ProjectHealth } from "@/features/portfolio/portfolio";

import { AppFrame, MockButton, highlight } from "../mock";
import { DemoScene, between, fadeIn, progress, tween } from "../timeline";

const LOOK = 1300;
const TILE = 4300;
const CLICK_TILE = 5000;
const FILTERED = 5100;
const RESET = 7600;
const CLICK_RESET = 8300;
const ALL_BACK = 8400;
const HELP = 9600;
const CLICK_HELP = 10300;
const POPOVER = 10400;
const END = POPOVER + 4200;

interface DemoProject {
  id: string;
  name: string;
  initial: string;
  color: string;
  health: ProjectHealth;
  progress: number;
  done: number;
  total: number;
  overdue: number;
  due: string;
  activity: string;
  sprint?: { name: string; state: "active" | "late"; progress: number; range: string };
  reasons: string[];
}

const PROJECTS: DemoProject[] = [
  {
    id: "site-vitrine",
    name: "Site vitrine",
    initial: "S",
    color: "bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-300",
    health: "off-track",
    progress: 0.45,
    done: 12,
    total: 26,
    overdue: 4,
    due: "6 nov.",
    activity: "il y a 2 h",
    sprint: { name: "Sprint 3", state: "late", progress: 0.6, range: "20 oct. → 2 nov." },
    reasons: [
      "Le sprint « Sprint 3 » a dépassé sa date de fin.",
      "4 tâches ont dépassé leur échéance.",
    ],
  },
  {
    id: "app-mobile",
    name: "App mobile",
    initial: "A",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-300",
    health: "at-risk",
    progress: 0.62,
    done: 18,
    total: 29,
    overdue: 1,
    due: "8 nov.",
    activity: "il y a 40 min",
    sprint: { name: "Sprint 5", state: "active", progress: 0.48, range: "3 nov. → 16 nov." },
    reasons: ["1 tâche en retard.", "Le sprint avance moins vite que le temps écoulé."],
  },
  {
    id: "blog",
    name: "Refonte du blog",
    initial: "R",
    color: "bg-violet-100 text-violet-700 dark:bg-violet-500/20 dark:text-violet-300",
    health: "on-track",
    progress: 0.8,
    done: 16,
    total: 20,
    overdue: 0,
    due: "14 nov.",
    activity: "hier",
    sprint: { name: "Sprint 2", state: "active", progress: 0.75, range: "2 nov. → 15 nov." },
    reasons: ["Aucune tâche en retard, sprint dans les temps."],
  },
  {
    id: "extranet",
    name: "Extranet client",
    initial: "E",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300",
    health: "on-track",
    progress: 0.35,
    done: 7,
    total: 20,
    overdue: 0,
    due: "21 nov.",
    activity: "il y a 3 j",
    reasons: ["Aucune tâche en retard."],
  },
];

const TILES: ProjectHealth[] = ["off-track", "at-risk", "on-track", "done"];

const COUNTS: Record<string, number> = {
  "off-track": 1,
  "at-risk": 1,
  "on-track": 2,
  done: 0,
};

const percent = (value: number) => `${Math.round(value * 100)} %`;

const ProgressBar = ({ value }: { value: number }) => (
  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
    <div className="h-full rounded-full bg-primary" style={{ width: `${value * 100}%` }} />
  </div>
);

const Stat = ({
  icon: Icon,
  label,
  value,
  warning,
}: {
  icon: typeof CalendarIcon;
  label: string;
  value: string;
  warning?: boolean;
}) => (
  <div className="flex min-w-0 flex-col gap-0.5">
    <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
      <Icon className="size-2.5" />
      {label}
    </span>
    <span
      className={cn(
        "truncate text-xs font-medium tabular-nums",
        warning && "text-rose-700 dark:text-rose-400",
      )}
    >
      {value}
    </span>
  </div>
);

/** Carte d'un projet du portefeuille : avancement, retards, sprint et raisons de sa santé. */
const ProjectCard = ({ project }: { project: DemoProject }) => {
  const health = HEALTH_CONFIG[project.health];

  return (
    <article
      data-demo={`card-${project.id}`}
      className="flex min-w-0 flex-col gap-2.5 rounded-lg border bg-card p-3 shadow-xs"
    >
      <header className="flex items-start justify-between gap-2">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded text-[11px] font-semibold",
              project.color,
            )}
          >
            {project.initial}
          </span>
          <span className="truncate text-xs font-semibold">{project.name}</span>
        </span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-medium",
            health.badge,
          )}
        >
          <span className={cn("size-1.5 rounded-full", health.dot)} />
          {health.label}
        </span>
      </header>

      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <ProgressBar value={project.progress} />
          <span className="text-[11px] font-medium tabular-nums">{percent(project.progress)}</span>
        </div>
        <p className="text-[10px] text-muted-foreground tabular-nums">
          {project.done}/{project.total} tâches terminées
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Stat
          icon={AlertTriangleIcon}
          label="En retard"
          value={String(project.overdue)}
          warning={project.overdue > 0}
        />
        <Stat icon={CalendarIcon} label="Échéance" value={project.due} />
        <Stat icon={HistoryIcon} label="Activité" value={project.activity} />
      </div>

      {project.sprint && (
        <div className="flex flex-col gap-1 rounded-md bg-muted/50 p-2">
          <div className="flex items-center justify-between gap-2 text-[10px]">
            <span className="flex min-w-0 items-center gap-1 font-medium">
              <FlagIcon className="size-2.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{project.sprint.name}</span>
            </span>
            <span
              className={cn(
                "shrink-0 text-muted-foreground",
                project.sprint.state === "late" && "text-amber-700 dark:text-amber-400",
              )}
            >
              {project.sprint.state === "late" ? "À clôturer" : "En cours"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ProgressBar value={project.sprint.progress} />
            <span className="text-[10px] tabular-nums">{percent(project.sprint.progress)}</span>
          </div>
        </div>
      )}

      <ul className="flex flex-col gap-0.5 border-t pt-2 text-[10px] text-muted-foreground">
        {project.reasons.map((reason) => (
          <li key={reason} className="flex gap-1.5">
            <span className={cn("mt-1 size-1 shrink-0 rounded-full", health.dot)} />
            {reason}
          </li>
        ))}
      </ul>
    </article>
  );
};

/** Explication de la santé, comme la bulle « Calcul de la santé » de la vraie page. */
const HealthPopover = ({ visible }: { visible: number }) =>
  visible > 0 ? (
    <div
      data-demo="help-popover"
      className="absolute top-14 right-5 z-30 w-72 rounded-lg border bg-popover p-3 text-[11px] shadow-xl"
      style={{ opacity: visible, transform: `translateY(${(1 - visible) * 6}px)` }}
    >
      <p className="text-xs font-medium">Comment la santé est calculée</p>
      <ul className="mt-2 flex flex-col gap-1.5 text-muted-foreground">
        <li>
          <span className="font-medium text-rose-700 dark:text-rose-400">En retard</span> : le
          sprint a dépassé sa date de fin, ou au moins 3 tâches ouvertes ont dépassé leur échéance.
        </li>
        <li>
          <span className="font-medium text-amber-700 dark:text-amber-400">À surveiller</span> : au
          moins une tâche en retard, ou un sprint qui avance moins vite que le temps écoulé.
        </li>
        <li>
          <span className="font-medium text-primary">En bonne voie</span> : aucune tâche en retard
          et un sprint dans les temps.
        </li>
      </ul>
    </div>
  ) : null;

export const portfolioScene: DemoScene = {
  id: "portfolio",
  title: "Suivre tous les projets",
  duration: END,
  steps: [
    { at: 0, label: "Tous les projets de l'espace, d'un coup d'œil" },
    { at: TILE - 400, label: "Filtrez par santé" },
    { at: RESET - 400, label: "Revenez à tous les projets" },
    { at: HELP - 400, label: "La santé est expliquée sur chaque carte" },
  ],
  clicks: [CLICK_TILE, CLICK_RESET, CLICK_HELP],
  cursor: [
    { at: 0, x: 560, y: 420 },
    { at: TILE, target: "tile-at-risk" },
    { at: RESET, target: "tile-at-risk" },
    { at: HELP, target: "btn-help" },
  ],
  camera: [
    { at: 0, x: 535, y: 300, zoom: 1.27 },
    { at: LOOK, x: 535, y: 390, zoom: 1.3 },
    { at: TILE - 600, x: 535, y: 180, zoom: 1.3 },
    { at: FILTERED + 300, x: 535, y: 330, zoom: 1.3 },
    { at: RESET - 500, x: 535, y: 180, zoom: 1.3 },
    { at: POPOVER, x: 535, y: 170, zoom: 1.3 },
  ],
  render: (t) => {
    const filtered = between(t, FILTERED, ALL_BACK);
    const active = filtered ? "at-risk" : null;
    const visible = filtered
      ? PROJECTS.filter((project) => project.health === "at-risk")
      : PROJECTS;
    // Défilement simulé : on descend sur les cartes, puis on remonte vers les filtres.
    const scrollY =
      t < LOOK
        ? 0
        : t < TILE - 800
          ? tween(t, LOOK, LOOK + 900, 0, -120)
          : tween(t, TILE - 800, TILE - 200, -120, 0);

    return (
      <AppFrame
        title="Portefeuille"
        active="Accueil"
        overlay={<HealthPopover visible={between(t, POPOVER, END) ? fadeIn(t, POPOVER) : 0} />}
      >
        <div
          className="flex flex-col gap-3"
          style={{ transform: `translateY(${scrollY}px)`, willChange: "transform" }}
        >
          <div className="flex items-end justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-sm font-semibold tracking-tight">Portefeuille</h1>
              <p className="text-[11px] text-muted-foreground">
                L&apos;avancement et la santé de tous les projets de l&apos;espace.
              </p>
            </div>
            <MockButton
              demo="btn-help"
              variant="ghost"
              size="sm"
              hover={between(t, HELP + 400, POPOVER + 2000)}
              className="text-muted-foreground"
            >
              <InfoIcon />
              Calcul de la santé
            </MockButton>
          </div>

          <div data-demo="tiles" className="grid grid-cols-4 gap-2">
            {TILES.map((key) => (
              <span
                key={key}
                data-demo={`tile-${key}`}
                className={cn(
                  "flex items-center justify-between gap-2 rounded-lg border bg-card px-2.5 py-2 shadow-xs",
                  active === key && "border-primary ring-1 ring-primary",
                )}
                style={
                  key === "at-risk"
                    ? highlight(
                        filtered
                          ? progress(t, FILTERED, FILTERED + 900)
                          : progress(t, ALL_BACK, ALL_BACK + 900),
                      )
                    : undefined
                }
              >
                <span className="flex min-w-0 items-center gap-1.5 text-[11px]">
                  <span className={cn("size-2 shrink-0 rounded-full", HEALTH_CONFIG[key].dot)} />
                  <span className="truncate">{HEALTH_CONFIG[key].label}</span>
                </span>
                <span className="text-sm font-semibold tabular-nums">{COUNTS[key]}</span>
              </span>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="flex h-7 w-48 items-center gap-1.5 rounded-md border bg-background px-2 text-[11px] text-muted-foreground">
              <SearchIcon className="size-3" />
              Rechercher un projet
            </span>
            <span className="flex h-7 w-36 items-center justify-between rounded-md border bg-background px-2 text-[11px]">
              {filtered ? "À surveiller" : "Toutes les santés"}
              <ChevronsUpDownIcon className="size-3 text-muted-foreground" />
            </span>
            <span className="flex h-7 w-28 items-center justify-between rounded-md border bg-background px-2 text-[11px]">
              Tri : Santé
              <ChevronsUpDownIcon className="size-3 text-muted-foreground" />
            </span>
          </div>

          <div data-demo="grid" className="grid grid-cols-2 gap-2.5">
            {visible.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        </div>
      </AppFrame>
    );
  },
};
