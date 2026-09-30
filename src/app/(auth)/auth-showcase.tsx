import { CheckIcon, TrendingUpIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { TaskStatus } from "@/features/tasks/types";
import {
  MiniAvatar,
  PreviewTaskCard,
  SAMPLE_TASKS,
  StatusLabel,
} from "@/components/landing/preview-data";

const HIGHLIGHTS = [
  "Kanban, tableau et calendrier pour chaque projet",
  "Statut, priorité, assignation et échéances",
  "Statistiques mensuelles de l'équipe",
];

const inProgress = SAMPLE_TASKS.filter((task) => task.status === TaskStatus.IN_PROGRESS);
const todo = SAMPLE_TASKS.filter((task) => task.status === TaskStatus.TODO);

/** Right-hand panel of the auth pages: a calm product preview. */
export const AuthShowcase = () => {
  return (
    <aside className="relative hidden overflow-hidden border-l bg-muted/40 lg:flex lg:flex-col lg:justify-center">
      <div className="mx-auto w-full max-w-lg px-10 py-16">
        <div className="animate-in duration-500 fade-in slide-in-from-bottom-2">
          <h2 className="text-2xl font-semibold tracking-tight text-balance">
            Toute l&apos;équipe, sur le même tableau.
          </h2>
          <ul className="mt-5 flex flex-col gap-2.5">
            {HIGHLIGHTS.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <CheckIcon className="size-3" />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-hidden
          className="relative mt-12 animate-in duration-700 fade-in slide-in-from-bottom-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Column status={TaskStatus.TODO} tasks={todo} />
            <Column status={TaskStatus.IN_PROGRESS} tasks={inProgress} />
          </div>

          <div className="absolute -right-4 -bottom-8 w-56 rounded-lg border bg-card p-4 shadow-md">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Tâches terminées</p>
              <span className="flex items-center gap-1 rounded-md bg-green-50 px-1.5 py-0.5 text-[11px] font-medium text-green-700 dark:bg-green-500/15 dark:text-green-300">
                <TrendingUpIcon className="size-3" />
                +18 %
              </span>
            </div>
            <p className="mt-1.5 text-2xl font-semibold tracking-tight">24</p>
            <div className="mt-3 flex -space-x-1.5">
              {["Léa", "Hugo", "Sam"].map((name) => (
                <MiniAvatar key={name} name={name} className="ring-2 ring-card" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

const Column = ({ status, tasks }: { status: TaskStatus; tasks: typeof SAMPLE_TASKS }) => (
  <div className={cn("flex flex-col gap-2 rounded-lg border bg-background/60 p-2")}>
    <div className="flex items-center justify-between px-1 py-0.5">
      <StatusLabel status={status} />
      <span className="text-xs text-muted-foreground">{tasks.length}</span>
    </div>
    {tasks.map((task) => (
      <PreviewTaskCard key={task.id} task={task} />
    ))}
  </div>
);
