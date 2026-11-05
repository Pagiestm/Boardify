import {
  BoldIcon,
  BookOpenIcon,
  CalendarDaysIcon,
  ChevronDownIcon,
  ChevronsUpDownIcon,
  FlagIcon,
  GanttChartIcon,
  ItalicIcon,
  KanbanSquareIcon,
  LayoutListIcon,
  ListIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
  TableIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { Badge } from "@/components/ui/badge";
import { TaskPriority, TaskStatus } from "@/features/tasks/types";
import { TASK_PRIORITY_CONFIG } from "@/features/tasks/constants";
import {
  MiniAvatar,
  PREVIEW_STATUSES,
  PreviewTaskCard,
  SAMPLE_TASKS,
  SampleTask,
  StatusLabel,
} from "@/components/landing/preview-data";

import {
  AppFrame,
  MockButton,
  MockDialog,
  MockField,
  MockMenu,
  MockSelect,
  MockToast,
  highlight,
} from "../mock";
import { DemoScene, between, fadeIn, progress, typed, typingDuration } from "../timeline";

const NAME = "Préparer la démo client";

const NEW_TASK: SampleTask = {
  id: "new",
  name: NAME,
  status: TaskStatus.TODO,
  priority: TaskPriority.HIGH,
  assignee: "Léa",
  project: "Site vitrine",
  start: 30,
  day: 30,
};

const VIEWS = [
  { label: "Tableau", icon: TableIcon },
  { label: "Kanban", icon: KanbanSquareIcon },
  { label: "Calendrier", icon: CalendarDaysIcon },
  { label: "Frise", icon: GanttChartIcon },
];

/** Bandeau replié des indicateurs de flux, sous la barre de sprint. */
export const FlowStrip = () => (
  <div className="flex items-center justify-between gap-2 rounded-lg border bg-card px-3 py-1 text-xs shadow-xs">
    <span className="font-medium">
      Indicateurs de flux
      <span className="ml-1.5 font-normal text-muted-foreground">
        temps de cycle, débit, flux cumulé
      </span>
    </span>
    <ChevronDownIcon className="size-3.5 text-muted-foreground" />
  </div>
);

/** Barre de sprint repliée : aucun sprint sélectionné. */
const EmptySprintBar = () => (
  <div className="flex items-center gap-3 rounded-lg border bg-card p-2 shadow-xs">
    <span className="flex h-7 w-28 shrink-0 items-center gap-2 rounded-md border bg-background px-2 text-xs">
      <FlagIcon className="size-3 text-muted-foreground" />
      <span className="flex-1 truncate">Tous les sprints</span>
      <ChevronsUpDownIcon className="size-3 text-muted-foreground" />
    </span>
    <span className="min-w-0 truncate text-[11px] text-muted-foreground">
      Découpez le projet en sprints pour suivre ce qui doit être livré et quand.
    </span>
    <MockButton variant="outline" size="sm" className="ml-auto">
      <PlusIcon />
      Nouveau sprint
    </MockButton>
  </div>
);

/** Ligne de filtres de la vue des tâches. */
const Filters = () => (
  <div className="flex items-center gap-1.5">
    {["Tous les statuts", "Tous les membres", "Toutes les étiquettes", "Échéance"].map((label) => (
      <span
        key={label}
        className="flex h-7 min-w-0 flex-1 items-center justify-between gap-1 rounded-md border bg-background px-2 text-[11px] text-muted-foreground"
      >
        <span className="truncate">{label}</span>
        <ChevronsUpDownIcon className="size-3 shrink-0" />
      </span>
    ))}
  </div>
);

/**
 * Page d'un projet : en-tête, barre de sprint, indicateurs de flux, vues et filtres.
 * `chrome` est désactivé par la démo des sprints, qui dessine sa propre barre.
 */
export const TaskToolbar = ({
  view = "Kanban",
  hoverNew,
  project = "Site vitrine",
  chrome = true,
}: {
  view?: string;
  hoverNew?: boolean;
  project?: string;
  chrome?: boolean;
}) => (
  <div className="flex flex-col gap-2.5">
    <div className="flex items-center justify-between gap-2">
      <span className="flex min-w-0 items-center gap-2">
        <span className="flex size-6 shrink-0 items-center justify-center rounded bg-green-100 text-[11px] font-semibold text-green-700 dark:bg-green-500/20 dark:text-green-300">
          {project[0]}
        </span>
        <span className="truncate text-sm font-semibold">{project}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        <MockButton demo="project-docs" variant="outline" size="sm">
          <BookOpenIcon />
          Documentation
        </MockButton>
        <MockButton demo="project-settings" variant="outline" size="sm">
          <SettingsIcon />
          Paramètres
        </MockButton>
      </span>
    </div>
    {chrome && (
      <>
        <EmptySprintBar />
        <FlowStrip />
      </>
    )}
    <div className="flex flex-col gap-2 rounded-lg border bg-card p-2 shadow-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-lg bg-muted p-0.5">
          {VIEWS.map(({ label, icon: Icon }) => (
            <span
              key={label}
              data-demo={`view-${label}`}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs",
                label === view ? "bg-background font-medium shadow-xs" : "text-muted-foreground",
              )}
            >
              <Icon className="size-3.5" />
              {label}
            </span>
          ))}
        </div>
        <span className="flex items-center gap-1.5">
          <MockButton demo="saved-views" variant="outline" size="sm">
            <LayoutListIcon />
            Vues
          </MockButton>
          <MockButton demo="new-task" size="sm" hover={hoverNew}>
            <PlusIcon />
            Nouvelle tâche
            <Kbd className="h-4 min-w-4 border-white/30 bg-white/15 text-[10px] text-primary-foreground">
              N
            </Kbd>
          </MockButton>
        </span>
      </div>
      <Filters />
    </div>
  </div>
);

/** Colonnes du Kanban de démonstration. */
export const MockKanban = ({
  tasks,
  render,
  minHeight = 240,
}: {
  tasks: SampleTask[];
  render?: (task: SampleTask) => React.ReactNode;
  /** Hauteur des colonnes : réduite quand la scène affiche la barre de sprint. */
  minHeight?: number;
}) => (
  <div className="grid grid-cols-4 gap-2.5">
    {PREVIEW_STATUSES.map((status) => {
      const column = tasks.filter((task) => task.status === status);
      return (
        <div
          key={status}
          data-demo={`column-${status}`}
          className="flex flex-col gap-2 overflow-hidden rounded-lg bg-muted/60 p-2"
          style={{ height: minHeight }}
        >
          <div className="flex items-center justify-between px-1 py-0.5">
            <StatusLabel status={status} />
            <span className="text-xs text-muted-foreground">{column.length}</span>
          </div>
          {column.map((task) => (
            <div key={task.id} data-demo={`card-${task.id}`}>
              {render ? render(task) : <PreviewTaskCard task={task} />}
            </div>
          ))}
        </div>
      );
    })}
  </div>
);

const T = {
  pressN: 800,
  open: 1000,
  typeName: 1700,
  priority: 1700 + typingDuration(NAME) + 400,
} as const;
const OPEN_PRIORITY = T.priority + 650;
const PICK_HIGH = OPEN_PRIORITY + 900;
const PERIOD = PICK_HIGH + 500;
const PICK_PERIOD = PERIOD + 650;
const CREATE = PICK_PERIOD + 700;
const CLICK_CREATE = CREATE + 700;
const CLOSE = CLICK_CREATE + 100;
const SHOW_CARD = CLOSE + 500;

export const createTaskScene: DemoScene = {
  id: "create-task",
  title: "Créer une tâche",
  duration: SHOW_CARD + 3200,
  steps: [
    { at: 0, label: "Appuyez sur N pour créer une tâche" },
    { at: T.typeName, label: "Donnez-lui un nom" },
    { at: T.priority, label: "Choisissez la priorité et la période" },
    { at: CREATE, label: "Cliquez sur Créer" },
    { at: SHOW_CARD, label: "La tâche apparaît dans le Kanban" },
  ],
  keystrokes: [{ at: T.pressN, keys: "N" }],
  clicks: [OPEN_PRIORITY, PICK_HIGH, PICK_PERIOD, CLICK_CREATE],
  cursor: [
    { at: 0, x: 560, y: 330 },
    { at: T.priority, target: "field-priority" },
    { at: OPEN_PRIORITY + 250, target: "opt-high" },
    { at: PICK_HIGH + 150, target: "field-period" },
    { at: CREATE, target: "btn-create" },
    { at: CLOSE + 300, x: 640, y: 420 },
  ],
  camera: [
    { at: 0, x: 440, y: 275, zoom: 1 },
    { at: T.open + 300, target: "field-name", zoom: 1.6 },
    { at: T.priority - 200, target: "dialog-fields", zoom: 1.45 },
    { at: CREATE - 100, target: "btn-create", zoom: 1.5 },
    { at: CLOSE, x: 440, y: 275, zoom: 1 },
    { at: SHOW_CARD, target: "card-new", zoom: 1.7 },
  ],
  render: (t) => {
    const dialog = between(t, T.open, CLOSE + 250)
      ? t < CLOSE
        ? fadeIn(t, T.open)
        : 1 - progress(t, CLOSE, CLOSE + 250)
      : 0;
    const name = typed(t, T.typeName, NAME);
    const priorityOpen = between(t, OPEN_PRIORITY, PICK_HIGH);
    const tasks = t >= CLOSE ? [NEW_TASK, ...SAMPLE_TASKS] : SAMPLE_TASKS;

    return (
      <AppFrame
        title="Site vitrine"
        active="Site vitrine"
        overlay={
          <>
            <MockDialog
              demo="dialog"
              title="Créer une tâche"
              visible={dialog}
              width={500}
              footer={
                <>
                  <MockButton variant="outline">Annuler</MockButton>
                  <MockButton demo="btn-create" hover={between(t, CREATE + 600, CLOSE)}>
                    Créer
                  </MockButton>
                </>
              }
            >
              <span className="flex items-center justify-between gap-2 rounded-md border border-dashed px-2.5 py-1.5 text-[11px] text-muted-foreground">
                Partir d&apos;un modèle
                <ChevronsUpDownIcon className="size-3" />
              </span>
              <MockField
                demo="field-name"
                label="Nom de la tâche"
                placeholder="Ex. : Préparer la démo client"
                value={name}
                focused={between(t, T.open, T.priority)}
              />
              <span className="flex items-center gap-1.5 self-start rounded-md border px-2 py-1 text-[11px] font-medium">
                <SparklesIcon className="size-3" />
                Compléter avec l&apos;IA
              </span>
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-medium">Description</span>
                <div className="overflow-hidden rounded-md border bg-background">
                  <div className="flex items-center gap-1 border-b px-1.5 py-1 text-[10px]">
                    <span className="rounded bg-muted px-1.5 py-0.5 font-medium">Écrire</span>
                    <span className="px-1.5 py-0.5 text-muted-foreground">Aperçu</span>
                    <span className="ml-1 flex items-center gap-1 text-muted-foreground">
                      <BoldIcon className="size-2.5" />
                      <ItalicIcon className="size-2.5" />
                      <ListIcon className="size-2.5" />
                    </span>
                  </div>
                  <span className="block px-2.5 py-2 text-[11px] text-muted-foreground">
                    Contexte, étapes, liens utiles…
                  </span>
                </div>
              </div>
              <div
                data-demo="dialog-fields"
                className="relative grid max-h-[190px] grid-cols-2 gap-3 overflow-hidden [mask-image:linear-gradient(to_bottom,black_80%,transparent)]"
              >
                <MockSelect
                  label="Statut"
                  value={
                    <Badge variant={TaskStatus.TODO} dot>
                      À faire
                    </Badge>
                  }
                />
                <div className="relative">
                  <MockSelect
                    demo="field-priority"
                    label="Priorité"
                    open={priorityOpen}
                    value={
                      t >= PICK_HIGH ? (
                        <Badge variant={TaskPriority.HIGH}>Haute</Badge>
                      ) : (
                        <span className="text-muted-foreground">Choisir une priorité</span>
                      )
                    }
                  />
                  {priorityOpen && (
                    <MockMenu
                      className="absolute top-full right-0 left-0 mt-1"
                      highlighted={t >= OPEN_PRIORITY + 700 ? "opt-high" : undefined}
                      items={[TaskPriority.HIGH, TaskPriority.MEDIUM, TaskPriority.LOW].map(
                        (priority) => ({
                          id: priority === TaskPriority.HIGH ? "opt-high" : `opt-${priority}`,
                          label: (
                            <Badge variant={priority}>{TASK_PRIORITY_CONFIG[priority].label}</Badge>
                          ),
                        }),
                      )}
                    />
                  )}
                </div>
                <MockSelect
                  label="Assigné à"
                  value={
                    <>
                      <MiniAvatar name="Léa" />
                      Léa
                    </>
                  }
                />
                <MockSelect
                  demo="field-period"
                  label="Période"
                  open={between(t, PICK_PERIOD, PICK_PERIOD + 300)}
                  value={
                    t >= PICK_PERIOD + 150 ? (
                      "30 oct. → 4 nov."
                    ) : (
                      <span className="text-muted-foreground">Choisir les dates</span>
                    )
                  }
                />
                <MockSelect label="Projet" value="Site vitrine" />
                <MockSelect
                  label="Étiquettes"
                  value={<span className="text-muted-foreground">Aucune</span>}
                />
                <MockSelect
                  label="Sprint"
                  value={<span className="text-muted-foreground">Sans sprint</span>}
                />
                <MockField label="Estimation (points)" placeholder="Ex. : 3" />
                <MockSelect
                  label="Répétition"
                  value={<span className="text-muted-foreground">Jamais</span>}
                />
                <MockSelect
                  label="Bloquée par"
                  value={<span className="text-muted-foreground">Choisir des tâches</span>}
                />
              </div>
            </MockDialog>
            <MockToast visible={between(t, CLOSE, CLOSE + 2600) ? fadeIn(t, CLOSE) : 0}>
              Tâche créée
            </MockToast>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <TaskToolbar hoverNew={between(t, T.pressN, T.open + 200)} />
          <MockKanban
            tasks={tasks}
            render={(task) =>
              task.id === "new" ? (
                <div
                  className="rounded-md"
                  style={highlight(progress(t, SHOW_CARD, SHOW_CARD + 1800))}
                >
                  <PreviewTaskCard task={task} />
                </div>
              ) : (
                <PreviewTaskCard task={task} />
              )
            }
          />
        </div>
      </AppFrame>
    );
  },
};
