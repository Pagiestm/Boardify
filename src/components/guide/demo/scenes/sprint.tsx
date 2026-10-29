import {
  CalendarIcon,
  ChevronsUpDownIcon,
  FlagIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  TrophyIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TaskPriority, TaskStatus } from "@/features/tasks/types";
import { MiniAvatar, SampleTask } from "@/components/landing/preview-data";

import { MockKanban, TaskToolbar } from "./create-task";
import {
  AppFrame,
  MockButton,
  MockDialog,
  MockField,
  MockMenu,
  MockToast,
  highlight,
} from "../mock";
import { DemoScene, between, fadeIn, progress, tween, typed, typingDuration } from "../timeline";

const GOAL = "Livrer la nouvelle page de paiement";
const SPRINT = "Sprint 3";
const RANGE = "20 oct. → 2 nov.";

interface SprintTask extends SampleTask {
  points: number;
  /** Instant où la tâche passe dans « Terminé », si elle y passe. */
  doneAt?: number;
}

const T = {
  newSprint: 300,
  clickNew: 1000,
  open: 1100,
  goalMove: 1900,
  clickGoal: 2500,
  typeGoal: 2700,
} as const;
const CREATE = T.typeGoal + typingDuration(GOAL) + 400;
const CLICK_CREATE = CREATE + 700;
const CLOSE = CLICK_CREATE + 100;
const TRACK = CLOSE + 900;
const DONE = [TRACK + 500, TRACK + 1300, TRACK + 2100, TRACK + 2900];
const TRACK_END = TRACK + 3500;
const FINISH = TRACK_END + 300;
const CLICK_FINISH = FINISH + 700;
const DIALOG = CLICK_FINISH + 100;
const SELECT_MOVE = DIALOG + 600;
const OPEN_SELECT = SELECT_MOVE + 600;
const PICK = OPEN_SELECT + 800;
const CONFIRM = PICK + 300;
const CLICK_CONFIRM = CONFIRM + 700;
const COMPLETED = CLICK_CONFIRM + 100;
const END = COMPLETED + 3000;

const TASKS: SprintTask[] = [
  {
    id: "s1",
    name: "Maquettes de la page paiement",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    assignee: "Léa",
    project: "Site vitrine",
    start: 20,
    day: 22,
    points: 5,
    doneAt: DONE[0],
  },
  {
    id: "s2",
    name: "Intégration de Stripe",
    status: TaskStatus.IN_PROGRESS,
    priority: TaskPriority.HIGH,
    assignee: "Sam",
    project: "Site vitrine",
    start: 21,
    day: 30,
    points: 8,
  },
  {
    id: "s3",
    name: "Page de confirmation",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    assignee: "Hugo",
    project: "Site vitrine",
    start: 22,
    day: 25,
    points: 3,
    doneAt: DONE[1],
  },
  {
    id: "s4",
    name: "Textes des offres",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    assignee: "Léa",
    project: "Site vitrine",
    start: 23,
    day: 27,
    points: 2,
    doneAt: DONE[2],
  },
  {
    id: "s5",
    name: "Tests du parcours d'achat",
    status: TaskStatus.IN_REVIEW,
    priority: TaskPriority.MEDIUM,
    assignee: "Hugo",
    project: "Site vitrine",
    start: 26,
    day: 31,
    points: 2,
  },
  {
    id: "s6",
    name: "Bandeau de lancement",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    assignee: "Sam",
    project: "Site vitrine",
    start: 28,
    day: 29,
    points: 1,
    doneAt: DONE[3],
  },
];

const tasksAt = (t: number) =>
  TASKS.map((task) =>
    task.doneAt !== undefined && t >= task.doneAt ? { ...task, status: TaskStatus.DONE } : task,
  );

const statsAt = (t: number) => {
  const tasks = tasksAt(t);
  const done = tasks.filter((task) => task.status === TaskStatus.DONE);
  const load = new Map<string, { open: number; total: number }>();
  for (const task of tasks) {
    const entry = load.get(task.assignee) ?? { open: 0, total: 0 };
    entry.total += task.points;
    if (task.status !== TaskStatus.DONE) entry.open += task.points;
    load.set(task.assignee, entry);
  }
  const points = tasks.reduce((sum, task) => sum + task.points, 0);
  const donePoints = done.reduce((sum, task) => sum + task.points, 0);
  return {
    tasks: tasks.length,
    doneTasks: done.length,
    points,
    donePoints,
    load: [...load.entries()].sort((a, b) => b[1].open - a[1].open),
  };
};

/** Barre des sprints d'un projet, avec le panneau d'avancement du sprint sélectionné. */
const SprintBar = ({ t }: { t: number }) => {
  const selected = t >= CLOSE;
  const completed = t >= COMPLETED;
  const stats = statsAt(t);
  const ratio = stats.points ? stats.donePoints / stats.points : 0;
  const daysLeft = Math.round(tween(t, TRACK, TRACK_END, 13, 2));
  const maxLoad = Math.max(1, ...stats.load.map(([, entry]) => entry.total));

  return (
    <section
      data-demo="sprint-bar"
      className="rounded-lg border bg-card shadow-xs"
      style={selected ? highlight(progress(t, CLOSE, CLOSE + 1500)) : undefined}
    >
      <div className="flex items-center gap-3 p-3">
        <span className="flex h-8 w-28 shrink-0 items-center gap-2 rounded-md border bg-background px-2.5 text-xs">
          <FlagIcon className="size-3.5 text-muted-foreground" />
          <span className="flex-1 truncate">{selected ? SPRINT : "Tous les sprints"}</span>
          <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
        </span>
        {selected && (
          <span className="flex min-w-0 items-center gap-2 text-xs">
            <span
              className="rounded-md"
              style={completed ? highlight(progress(t, COMPLETED, COMPLETED + 1500)) : undefined}
            >
              <Badge
                className={
                  completed ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary"
                }
              >
                {completed ? "Terminé" : "En cours"}
              </Badge>
            </span>
            <span className="whitespace-nowrap text-muted-foreground tabular-nums">
              {RANGE}
              {!completed && ` · ${daysLeft} j restant${daysLeft > 1 ? "s" : ""}`}
            </span>
          </span>
        )}
        <span className="ml-auto flex items-center gap-1.5">
          {selected && !completed && (
            <>
              <MockButton variant="outline" size="sm" className="w-7 px-0">
                <PencilIcon />
              </MockButton>
              <MockButton
                demo="btn-finish"
                variant="outline"
                size="sm"
                hover={between(t, FINISH + 500, CLICK_FINISH + 200)}
              >
                <TrophyIcon />
                Terminer
              </MockButton>
            </>
          )}
          {selected && (
            <span className="flex size-7 items-center justify-center text-muted-foreground">
              <Trash2Icon className="size-3.5" />
            </span>
          )}
          <MockButton
            demo="btn-new-sprint"
            variant={selected ? "ghost" : "outline"}
            size="sm"
            hover={between(t, T.newSprint + 500, T.open)}
          >
            <PlusIcon />
            Nouveau sprint
          </MockButton>
        </span>
      </div>
      {selected && (
        <div
          data-demo="sprint-stats"
          className="grid grid-cols-2 gap-4 border-t px-3 py-2.5"
          style={{ opacity: fadeIn(t, CLOSE, 300) }}
        >
          <div className="flex flex-col gap-1.5">
            <p className="truncate text-xs">
              <span className="text-muted-foreground">Objectif : </span>
              {GOAL}
            </p>
            <div className="flex items-center gap-2">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.round(ratio * 100)}%` }}
                />
              </div>
              <span className="w-9 text-right text-xs font-medium tabular-nums">
                {Math.round(ratio * 100)} %
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground tabular-nums">
              {stats.doneTasks}/{stats.tasks} tâches · {stats.donePoints}/{stats.points} points
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-[11px] font-medium text-muted-foreground">
              Charge restante (points)
            </p>
            {stats.load.map(([name, entry]) => (
              <div key={name} className="flex items-center gap-2 text-[11px]">
                <MiniAvatar name={name} className="size-4 text-[9px]" />
                <span className="w-10 truncate">{name}</span>
                <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary/25"
                    style={{ width: `${(entry.total / maxLoad) * 100}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-primary"
                    style={{ width: `${(entry.open / maxLoad) * 100}%` }}
                  />
                </div>
                <span className="w-8 text-right tabular-nums">
                  {entry.open}/{entry.total}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export const sprintScene: DemoScene = {
  id: "sprint",
  title: "Planifier et terminer un sprint",
  duration: END,
  steps: [
    { at: 0, label: "Cliquez sur Nouveau sprint" },
    { at: T.goalMove, label: "Donnez-lui un objectif" },
    { at: CREATE, label: "Cliquez sur Créer le sprint" },
    { at: TRACK - 300, label: "Suivez l'avancement et la charge de chacun" },
    { at: FINISH, label: "Terminez le sprint et reportez le reste" },
  ],
  clicks: [T.clickNew, T.clickGoal, CLICK_CREATE, CLICK_FINISH, OPEN_SELECT, PICK, CLICK_CONFIRM],
  cursor: [
    { at: 0, x: 520, y: 330 },
    { at: T.newSprint, target: "btn-new-sprint" },
    { at: T.goalMove, target: "field-goal", duration: 500 },
    { at: CREATE, target: "btn-create-sprint" },
    { at: CLOSE + 200, x: 560, y: 380, duration: 800 },
    { at: FINISH, target: "btn-finish" },
    { at: SELECT_MOVE, target: "field-move-to" },
    { at: OPEN_SELECT + 300, target: "opt-no-sprint", duration: 400 },
    { at: CONFIRM, target: "btn-confirm-finish" },
    { at: COMPLETED + 300, x: 600, y: 400, duration: 800 },
  ],
  camera: [
    { at: 0, x: 440, y: 275, zoom: 1 },
    { at: 150, target: "btn-new-sprint", zoom: 1.5, duration: 800 },
    { at: T.open + 150, target: "sprint-dialog", zoom: 1.45 },
    { at: CLOSE, x: 440, y: 275, zoom: 1, duration: 600 },
    { at: CLOSE + 500, target: "sprint-bar", zoom: 1.4 },
    { at: TRACK + 200, target: "sprint-stats", zoom: 1.65 },
    { at: FINISH - 200, target: "btn-finish", zoom: 1.5, duration: 700 },
    { at: DIALOG + 100, target: "finish-dialog", zoom: 1.5 },
    { at: COMPLETED, x: 440, y: 275, zoom: 1, duration: 600 },
    { at: COMPLETED + 700, target: "sprint-bar", zoom: 1.35 },
  ],
  render: (t) => {
    const createDialog = between(t, T.open, CLOSE + 250)
      ? t < CLOSE
        ? fadeIn(t, T.open)
        : 1 - progress(t, CLOSE, CLOSE + 250)
      : 0;
    const finishDialog = between(t, DIALOG, COMPLETED + 250)
      ? t < COMPLETED
        ? fadeIn(t, DIALOG)
        : 1 - progress(t, COMPLETED, COMPLETED + 250)
      : 0;
    const selectOpen = between(t, OPEN_SELECT, PICK);
    const tasks = tasksAt(t);

    return (
      <AppFrame
        title="Site vitrine"
        active="Site vitrine"
        overlay={
          <>
            <MockDialog
              demo="sprint-dialog"
              title="Nouveau sprint"
              description="Un sprint regroupe les tâches à livrer sur une période donnée."
              visible={createDialog}
              width={420}
              footer={
                <>
                  <MockButton variant="ghost">Annuler</MockButton>
                  <MockButton demo="btn-create-sprint" hover={between(t, CREATE + 500, CLOSE)}>
                    Créer le sprint
                  </MockButton>
                </>
              }
            >
              <MockField label="Nom" value={SPRINT} />
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium">Période</span>
                <span className="flex h-8 items-center gap-2 rounded-md border bg-background px-2.5 text-xs">
                  <CalendarIcon className="size-3.5 text-muted-foreground" />
                  {RANGE}
                </span>
              </div>
              <MockField
                demo="field-goal"
                label="Objectif"
                multiline
                placeholder="Ex. : livrer la nouvelle page de paiement"
                value={typed(t, T.typeGoal, GOAL)}
                focused={between(t, T.clickGoal, CREATE + 500)}
              />
            </MockDialog>

            <MockDialog
              demo="finish-dialog"
              title={`Terminer « ${SPRINT} »`}
              description="4 tâches terminées sur 6 · 11/21 points livrés."
              visible={finishDialog}
              width={420}
              footer={
                <>
                  <MockButton variant="ghost">Annuler</MockButton>
                  <MockButton
                    demo="btn-confirm-finish"
                    hover={between(t, CONFIRM + 500, COMPLETED)}
                  >
                    Terminer le sprint
                  </MockButton>
                </>
              }
            >
              <div className="relative flex flex-col gap-1.5">
                <span className="text-xs font-medium">
                  Reporter les 2 tâches non terminées vers
                </span>
                <span
                  data-demo="field-move-to"
                  className={cn(
                    "flex h-8 items-center justify-between rounded-md border bg-background px-2.5 text-xs",
                    selectOpen && "border-ring ring-[3px] ring-ring/30",
                  )}
                >
                  Sans sprint
                  <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
                </span>
                {selectOpen && (
                  <MockMenu
                    className="absolute top-full right-0 left-0 mt-1"
                    highlighted={t >= OPEN_SELECT + 600 ? "opt-no-sprint" : undefined}
                    items={[{ id: "opt-no-sprint", label: "Sans sprint" }]}
                  />
                )}
              </div>
            </MockDialog>

            <MockToast visible={between(t, CLOSE, CLOSE + 2000) ? fadeIn(t, CLOSE) : 0}>
              Sprint créé
            </MockToast>
            <MockToast visible={t >= COMPLETED ? fadeIn(t, COMPLETED) : 0}>
              Sprint terminé, 2 tâches reportées
            </MockToast>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <SprintBar t={t} />
          <TaskToolbar />
          <MockKanban
            tasks={t >= COMPLETED ? tasks.filter((task) => task.status === TaskStatus.DONE) : tasks}
            render={(task) => {
              const doneAt = TASKS.find((item) => item.id === task.id)?.doneAt;
              return (
                <div
                  className="rounded-md border bg-card p-2 shadow-xs"
                  style={
                    doneAt !== undefined ? highlight(progress(t, doneAt, doneAt + 900)) : undefined
                  }
                >
                  <p className="text-[12px] leading-snug font-medium">{task.name}</p>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{(task as SprintTask).points} pts</span>
                    <MiniAvatar name={task.assignee} />
                  </div>
                </div>
              );
            }}
          />
        </div>
      </AppFrame>
    );
  },
};
