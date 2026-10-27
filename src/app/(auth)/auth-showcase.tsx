import { FaGithub } from "react-icons/fa";
import {
  BarChart3Icon,
  CircleDotIcon,
  LayoutGridIcon,
  MonitorIcon,
  TrendingUpIcon,
} from "lucide-react";

import { LogoMark } from "@/components/brand/logo";
import { TaskStatus } from "@/features/tasks/types";
import {
  MiniAvatar,
  PreviewTaskCard,
  SAMPLE_TASKS,
  StatusLabel,
} from "@/components/landing/preview-data";

const HIGHLIGHTS = [
  { icon: LayoutGridIcon, text: "Kanban, tableau, calendrier et frise pour chaque projet" },
  { icon: FaGithub, text: "Une issue GitHub synchronisée pour chaque tâche" },
  { icon: MonitorIcon, text: "Sur le web, et en application pour Mac, Windows et Linux" },
  { icon: BarChart3Icon, text: "Les statistiques de l'équipe, mois après mois" },
];

const todo = SAMPLE_TASKS.filter((task) => task.status === TaskStatus.TODO);

export const AuthShowcase = () => {
  return (
    <aside className="relative hidden overflow-hidden border-l bg-muted/40 lg:flex lg:flex-col lg:justify-center">
      <div className="mx-auto flex w-full max-w-lg flex-col gap-14 px-10 py-16">
        <div className="animate-in duration-500 fade-in slide-in-from-bottom-2">
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            Toute l&apos;équipe, sur le même tableau.
          </h2>
          <ul className="mt-6 flex flex-col gap-3">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Icon className="size-4" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div
          aria-hidden
          className="relative h-72 w-full animate-in duration-700 select-none fade-in slide-in-from-bottom-4"
        >
          <div className="absolute inset-x-[10%] inset-y-[15%] -z-10 rounded-full bg-primary/20 blur-3xl dark:bg-primary/10" />
          <div className="absolute top-6 left-0 flex w-56 -rotate-2 flex-col gap-2 rounded-xl border bg-background p-2 shadow-lg shadow-black/5">
            <div className="flex items-center justify-between px-1 py-0.5">
              <StatusLabel status={TaskStatus.TODO} />
              <span className="text-xs text-muted-foreground">{todo.length}</span>
            </div>
            {todo.map((task) => (
              <PreviewTaskCard key={task.id} task={task} />
            ))}
          </div>

          <div className="absolute top-0 right-0 w-52 rotate-2 rounded-xl border bg-card p-3.5 shadow-lg shadow-black/5">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <FaGithub className="size-3.5 text-foreground" />
              studio-nova/site · #42
            </div>
            <p className="mt-2 text-[13px] font-semibold">Préparer la mise en ligne</p>
            <div className="mt-2.5 flex flex-wrap items-center gap-1">
              <span className="flex items-center gap-1 rounded-full bg-[#1f883d] px-1.5 py-px text-[10px] font-medium text-white">
                <CircleDotIcon className="size-2.5" />
                Open
              </span>
              <span className="rounded-full bg-[#d73a4a] px-1.5 py-px text-[10px] font-medium text-white">
                priorité : haute
              </span>
            </div>
            <p className="mt-2.5 flex items-center gap-1.5 text-[10px] text-muted-foreground">
              <LogoMark className="size-3" />
              Synchronisée avec Boardify
            </p>
          </div>

          <div className="absolute right-0 bottom-0 w-52 rounded-xl border bg-card p-4 shadow-lg shadow-black/5">
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
