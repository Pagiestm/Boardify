import {
  CheckIcon,
  ListChecksIcon,
  Loader2Icon,
  RefreshCwIcon,
  SparklesIcon,
  SunIcon,
  UserCheckIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { TaskPriority } from "@/features/tasks/types";
import { TASK_PRIORITY_CONFIG } from "@/features/tasks/constants";

import { AppFrame, MockButton, highlight } from "../mock";
import { DemoScene, between, fadeIn, progress } from "../timeline";

const DEFAULT_INTRO =
  "L'assistant choisit vos tâches prioritaires du jour : retards, échéances, blocages.";
const PLAN_INTRO = "Trois tâches pour avancer sereinement aujourd'hui.";

const ITEMS = [
  {
    name: "Corriger le bug de connexion",
    reason: "En retard depuis hier et bloque la mise en ligne.",
    priority: TaskPriority.HIGH,
    due: "28 oct.",
    overdue: true,
  },
  {
    name: "Maquette de la page tarifs",
    reason: "Échéance demain, priorité haute.",
    priority: TaskPriority.HIGH,
    due: "30 oct.",
    overdue: false,
  },
  {
    name: "Relire la documentation",
    reason: "Débloque deux tâches de l'équipe.",
    priority: TaskPriority.MEDIUM,
    due: "4 nov.",
    overdue: false,
  },
];

const CLICK = 1300;
const PLAN = CLICK + 1600;
const ITEM_GAP = 450;
const REASONS = PLAN + ITEMS.length * ITEM_GAP + 300;
const DONE = REASONS + 3600;
const CHECKED = DONE + 900;
const END = CHECKED + 3200;

const StatCard = ({ title, value, delta }: { title: string; value: string; delta: string }) => (
  <div className="flex flex-col gap-2 rounded-xl border p-4">
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      {title}
      {title === "Tâches" ? (
        <ListChecksIcon className="size-3.5" />
      ) : (
        <UserCheckIcon className="size-3.5" />
      )}
    </div>
    <div className="flex items-end justify-between">
      <span className="text-2xl font-semibold">{value}</span>
      <span className="rounded-md bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-500/15 dark:text-green-300">
        ↑ {delta}
      </span>
    </div>
  </div>
);

export const focusDayScene: DemoScene = {
  id: "focus-day",
  title: "Préparer ma journée",
  duration: END,
  steps: [
    { at: 0, label: "Cliquez sur Préparer ma journée" },
    { at: CLICK, label: "L'assistant analyse vos tâches" },
    { at: PLAN, label: "Vos priorités du jour, avec la raison de chaque choix" },
    { at: DONE, label: "Une tâche terminée est cochée dans la liste" },
  ],
  clicks: [CLICK],
  cursor: [
    { at: 0, x: 520, y: 380 },
    { at: 500, target: "btn-focus" },
    { at: CLICK + 400, x: 600, y: 470 },
  ],
  camera: [
    { at: 0, x: 440, y: 275, zoom: 1 },
    { at: 300, target: "btn-focus", zoom: 1.6 },
    { at: PLAN - 200, target: "focus-card", zoom: 1.2 },
    { at: REASONS, target: "focus-item-1", dx: -40, zoom: 1.7 },
    { at: REASONS + 1200, target: "focus-item-2", dx: -40, zoom: 1.7, duration: 1000 },
    { at: REASONS + 2400, target: "focus-item-3", dx: -40, zoom: 1.7, duration: 1000 },
    { at: DONE, target: "focus-header", dx: -140, dy: 40, zoom: 1.5 },
    { at: CHECKED + 1300, x: 440, y: 275, zoom: 1 },
  ],
  render: (t) => {
    const loading = between(t, CLICK, PLAN);
    const planned = t >= PLAN;
    const done = t >= CHECKED;
    const visibleItems = ITEMS.filter((_, index) => t >= PLAN + index * ITEM_GAP);

    return (
      <AppFrame title="Accueil" active="Accueil">
        <div className="flex flex-col gap-3">
          <div data-demo="focus-card" className="overflow-hidden rounded-xl border bg-background">
            <div
              data-demo="focus-header"
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <SunIcon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    Ma journée
                    {planned && (
                      <span
                        className="rounded px-0.5 text-[11px] font-normal text-muted-foreground"
                        style={highlight(progress(t, CHECKED, CHECKED + 1500))}
                      >
                        {done ? 1 : 0}/3 terminée
                      </span>
                    )}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {planned ? PLAN_INTRO : DEFAULT_INTRO}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {planned && (
                  <span
                    className="text-[11px] text-muted-foreground"
                    style={{ opacity: fadeIn(t, PLAN) }}
                  >
                    Préparée à 9h02
                  </span>
                )}
                <MockButton
                  demo="btn-focus"
                  size="sm"
                  variant={planned ? "ghost" : "primary"}
                  hover={between(t, 1000, CLICK + 100)}
                >
                  {loading ? (
                    <Loader2Icon className="animate-spin" />
                  ) : planned ? (
                    <RefreshCwIcon />
                  ) : (
                    <SparklesIcon />
                  )}
                  {loading ? "Analyse…" : planned ? "Actualiser" : "Préparer ma journée"}
                </MockButton>
              </div>
            </div>
            {visibleItems.length > 0 && (
              <ol className="divide-y border-t">
                {visibleItems.map((item, index) => {
                  const appear = fadeIn(t, PLAN + index * ITEM_GAP, 300);
                  const isDone = index === 0 && done;
                  return (
                    <li
                      key={item.name}
                      data-demo={`focus-item-${index + 1}`}
                      className="flex items-start gap-3 px-4 py-2.5"
                      style={{ opacity: appear, transform: `translateY(${(1 - appear) * 6}px)` }}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[11px] font-medium",
                          isDone
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground",
                        )}
                      >
                        {isDone ? <CheckIcon className="size-3" /> : index + 1}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            "block truncate text-xs font-medium",
                            isDone && "text-muted-foreground line-through",
                          )}
                        >
                          {item.name}
                        </span>
                        <span className="block text-[11px] text-muted-foreground">
                          {item.reason}
                        </span>
                      </span>
                      {!isDone && (
                        <span className="flex shrink-0 flex-col items-end gap-0.5 text-[11px]">
                          <span className={TASK_PRIORITY_CONFIG[item.priority].text}>
                            {TASK_PRIORITY_CONFIG[item.priority].label}
                          </span>
                          <span
                            className={cn(
                              "text-muted-foreground",
                              item.overdue && "text-destructive",
                            )}
                          >
                            {item.overdue ? "En retard · " : ""}
                            {item.due}
                          </span>
                        </span>
                      )}
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatCard title="Tâches" value="24" delta="6" />
            <StatCard title="Assignées" value="9" delta="2" />
          </div>

          <div className="flex flex-col gap-2 rounded-xl border p-4">
            <span className="text-xs font-medium">Activité</span>
            <span className="text-[11px] text-muted-foreground">24 tâches créées sur 30 jours</span>
            <svg viewBox="0 0 600 90" className="h-24 w-full" preserveAspectRatio="none">
              <path
                d="M0 80 C 60 78, 90 60, 140 64 S 230 30, 280 46 S 380 70, 430 40 S 540 18, 600 22 L 600 90 L 0 90 Z"
                className="fill-primary/10"
              />
              <path
                d="M0 80 C 60 78, 90 60, 140 64 S 230 30, 280 46 S 380 70, 430 40 S 540 18, 600 22"
                className="fill-none stroke-primary"
                strokeWidth="2"
              />
            </svg>
          </div>
        </div>
      </AppFrame>
    );
  },
};
