import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  EyeOffIcon,
  MoreHorizontalIcon,
  PencilIcon,
  PlusIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "@/features/tasks/types";
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/features/tasks/constants";
import {
  MiniAvatar,
  PREVIEW_STATUSES,
  SAMPLE_TASKS,
  SampleTask,
} from "@/components/landing/preview-data";

import { TaskToolbar } from "./create-task";
import { AppFrame, highlight } from "../mock";
import { DemoScene, between, easeInOut, fadeIn, progress } from "../timeline";

/** Hauteur fixe des cartes : le déplacement d'une colonne à l'autre se calcule ainsi. */
const CARD_HEIGHT = 84;
const CARD_GAP = 8;
/** Une colonne plus loin : largeur de la carte + marges de la colonne + écart entre colonnes. */
const COLUMN_SHIFT = "(100% + 26px)";

interface Drag {
  id: string;
  from: TaskStatus;
  to: TaskStatus;
  start: number;
  end: number;
}

const KEY_VIEW = 400;
const SWITCH = 650;
const GRAB_1 = 1900;
const DROP_1 = GRAB_1 + 1700;
const GRAB_2 = DROP_1 + 1500;
const DROP_2 = GRAB_2 + 1700;
const MENU = DROP_2 + 1500;
const OPEN_MENU = MENU + 700;
const HOVER_FINAL = OPEN_MENU + 500;

const DRAGS: Drag[] = [
  { id: "t5", from: TaskStatus.TODO, to: TaskStatus.IN_PROGRESS, start: GRAB_1 + 150, end: DROP_1 },
  { id: "t2", from: TaskStatus.IN_REVIEW, to: TaskStatus.DONE, start: GRAB_2 + 150, end: DROP_2 },
];

const BOARD_TASKS = SAMPLE_TASKS.filter((task) => task.status !== TaskStatus.BACKLOG);

/** Statut de chaque tâche à l'instant t : une carte change de colonne à la fin de son glissement. */
const statusAt = (task: SampleTask, t: number) =>
  DRAGS.find((drag) => drag.id === task.id && t >= drag.end)?.to ?? task.status;

const BoardCard = ({ task, done }: { task: SampleTask; done: boolean }) => (
  <div
    className="flex flex-col justify-between rounded-md border bg-card p-2.5 shadow-xs"
    style={{ height: CARD_HEIGHT }}
  >
    <p
      className={cn(
        "line-clamp-2 text-[13px] leading-snug font-medium",
        done && "text-muted-foreground line-through",
      )}
    >
      {task.name}
    </p>
    <div className="flex items-center justify-between gap-1">
      <Badge variant={task.priority} className="px-1.5">
        {TASK_PRIORITY_CONFIG[task.priority].label}
      </Badge>
      <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
        <span className="flex items-center gap-1 whitespace-nowrap">{task.day} oct.</span>
        <MiniAvatar name={task.assignee} />
      </span>
    </div>
  </div>
);

const ColumnMenu = ({ hoverFinal }: { hoverFinal: boolean }) => (
  <div className="absolute top-7 right-0 z-20 flex w-48 flex-col rounded-lg border bg-popover p-1 text-xs shadow-lg">
    {[
      { icon: PencilIcon, label: "Renommer" },
      { icon: ArrowLeftIcon, label: "Déplacer à gauche" },
      { icon: ArrowRightIcon, label: "Déplacer à droite" },
    ].map(({ icon: Icon, label }) => (
      <span key={label} className="flex items-center gap-2 rounded-md px-2 py-1.5">
        <Icon className="size-3.5 text-muted-foreground" />
        {label}
      </span>
    ))}
    <span className="my-1 h-px bg-border" />
    <span className="px-2 py-1 text-[11px] text-muted-foreground">Couleur</span>
    <span className="flex gap-1 px-2 pb-1.5">
      {[
        "bg-teal-500",
        "bg-blue-500",
        "bg-amber-500",
        "bg-violet-500",
        "bg-green-500",
        "bg-pink-500",
      ].map((color) => (
        <span key={color} className={cn("size-4 rounded-full", color)} />
      ))}
    </span>
    <span className="my-1 h-px bg-border" />
    <span
      data-demo="menu-final"
      className={cn("flex items-center gap-2 rounded-md px-2 py-1.5", hoverFinal && "bg-accent")}
    >
      <CheckCircleIcon className="size-3.5 text-muted-foreground" />
      Marquer comme statut final
    </span>
    <span className="flex items-center gap-2 rounded-md px-2 py-1.5">
      <EyeOffIcon className="size-3.5 text-muted-foreground" />
      Masquer le statut
    </span>
  </div>
);

const Board = ({ t }: { t: number }) => {
  const active = DRAGS.find((drag) => between(t, drag.start, drag.end));

  return (
    <div className="grid grid-cols-4 gap-2.5">
      {PREVIEW_STATUSES.map((status) => {
        const cards = BOARD_TASKS.filter((task) => statusAt(task, t) === status);
        const isFinal = status === TaskStatus.DONE;
        const showMenu = status === TaskStatus.IN_REVIEW && t >= OPEN_MENU;

        return (
          <div
            key={status}
            data-demo={`column-${status}`}
            className="flex min-h-[420px] flex-col rounded-lg bg-muted/60 p-2"
          >
            <div className="relative flex items-center gap-2 px-1 pb-2">
              <span
                className={cn("size-2 shrink-0 rounded-full", TASK_STATUS_CONFIG[status].dot)}
              />
              <span className="truncate text-xs font-medium">
                {TASK_STATUS_CONFIG[status].label}
              </span>
              {isFinal && <CheckCircleIcon className="size-3.5 text-muted-foreground" />}
              <span className="text-xs text-muted-foreground tabular-nums">{cards.length}</span>
              <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                <PlusIcon className="size-3.5" />
                <span
                  data-demo={`col-menu-${status}`}
                  className={cn("rounded p-0.5", showMenu && "bg-accent text-foreground")}
                >
                  <MoreHorizontalIcon className="size-3.5" />
                </span>
              </span>
              {showMenu && <ColumnMenu hoverFinal={t >= HOVER_FINAL + 400} />}
            </div>
            <div className="flex flex-col" style={{ gap: CARD_GAP }}>
              {cards.map((task, index) => {
                const drag = active?.id === task.id ? active : undefined;
                const dropped = DRAGS.find((item) => item.id === task.id && t >= item.end);

                if (drag) {
                  const destination = BOARD_TASKS.filter((item) => item.status === drag.to).length;
                  const amount = easeInOut(progress(t, drag.start + 150, drag.end - 150));
                  const lift = Math.min(
                    fadeIn(t, drag.start, 150),
                    1 - fadeIn(t, drag.end - 150, 150),
                  );
                  const dy = (destination - index) * (CARD_HEIGHT + CARD_GAP) * amount;
                  return (
                    <div
                      key={task.id}
                      data-demo="drag-card"
                      className="relative z-10 rounded-md"
                      style={{
                        transform: `translate(calc(${amount} * ${COLUMN_SHIFT}), ${dy}px) rotate(${3 * lift}deg) scale(${1 + 0.03 * lift})`,
                        boxShadow: lift
                          ? `0 ${12 * lift}px ${24 * lift}px rgb(0 0 0 / ${0.18 * lift})`
                          : undefined,
                      }}
                    >
                      <BoardCard task={task} done={false} />
                    </div>
                  );
                }

                return (
                  <div
                    key={task.id}
                    data-demo={`card-${task.id}`}
                    className="rounded-md"
                    style={
                      dropped ? highlight(progress(t, dropped.end, dropped.end + 1500)) : undefined
                    }
                  >
                    <BoardCard task={task} done={isFinal} />
                  </div>
                );
              })}
              {active?.to === status && (
                <div
                  className="rounded-md border-2 border-dashed border-primary/40 bg-primary/5"
                  style={{ height: CARD_HEIGHT, opacity: fadeIn(t, active.start, 300) }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Vue Tableau affichée avant de passer au Kanban. */
const TablePreview = ({ opacity }: { opacity: number }) => (
  <div className="rounded-lg border" style={{ opacity }}>
    {BOARD_TASKS.map((task) => (
      <div
        key={task.id}
        className="flex items-center gap-3 border-b px-3 py-2.5 text-xs last:border-0"
      >
        <span className="flex-1 font-medium">{task.name}</span>
        <Badge variant={task.status} dot>
          {TASK_STATUS_CONFIG[task.status].label}
        </Badge>
      </div>
    ))}
  </div>
);

export const moveCardScene: DemoScene = {
  id: "move-card",
  title: "Déplacer une carte dans le Kanban",
  duration: HOVER_FINAL + 3200,
  steps: [
    { at: 0, label: "Passez en vue Kanban avec la touche 2" },
    { at: GRAB_1 - 600, label: "Glissez une carte vers « En cours »" },
    { at: GRAB_2 - 600, label: "Déposez-la dans « Terminé » : la tâche est terminée" },
    { at: MENU, label: "Le menu … personnalise chaque colonne" },
  ],
  keystrokes: [{ at: KEY_VIEW, keys: "2" }],
  clicks: [GRAB_1, DROP_1, GRAB_2, DROP_2, OPEN_MENU - 50],
  cursor: [
    { at: 0, x: 620, y: 420 },
    { at: GRAB_1 - 700, target: "card-t5", dx: -20, dy: -8 },
    { at: GRAB_1 + 150, target: "drag-card", dx: -20, dy: -8, duration: 120 },
    { at: DROP_1 + 300, x: 560, y: 470 },
    { at: GRAB_2 - 700, target: "card-t2", dx: -20, dy: -8 },
    { at: GRAB_2 + 150, target: "drag-card", dx: -20, dy: -8, duration: 120 },
    { at: DROP_2 + 300, x: 700, y: 420 },
    { at: MENU, target: "col-menu-IN_REVIEW" },
    { at: HOVER_FINAL, target: "menu-final", dx: -30 },
  ],
  camera: [
    { at: 0, x: 440, y: 275, zoom: 1 },
    { at: GRAB_1 - 900, target: "column-TODO", dx: 84, dy: -90, zoom: 1.5 },
    { at: GRAB_2 - 900, target: "column-IN_REVIEW", dx: 84, dy: -90, zoom: 1.5 },
    { at: DROP_2 + 400, x: 440, y: 275, zoom: 1 },
    { at: MENU + 200, target: "col-menu-IN_REVIEW", dx: -60, dy: 90, zoom: 1.6 },
  ],
  render: (t) => (
    <AppFrame title="Site vitrine" active="Site vitrine">
      <div className="flex flex-col gap-3">
        <TaskToolbar view={t >= SWITCH ? "Kanban" : "Tableau"} />
        {t >= SWITCH ? (
          <div style={{ opacity: fadeIn(t, SWITCH, 300) }}>
            <Board t={t} />
          </div>
        ) : (
          <TablePreview opacity={1} />
        )}
      </div>
    </AppFrame>
  ),
};
