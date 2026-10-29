import {
  CalculatorIcon,
  CalendarIcon,
  CheckCircle2Icon,
  CheckIcon,
  ClipboardListIcon,
  FileTextIcon,
  Loader2Icon,
  MegaphoneIcon,
  SettingsIcon,
  SparklesIcon,
  TextCursorInputIcon,
  Trash2Icon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { TaskPriority, TaskStatus } from "@/features/tasks/types";
import { TASK_PRIORITY_CONFIG } from "@/features/tasks/constants";
import {
  MiniAvatar,
  PreviewTaskCard,
  SAMPLE_TASKS,
  SampleTask,
} from "@/components/landing/preview-data";

import { MockKanban, TaskToolbar } from "./create-task";
import { AppFrame, MockButton, MockDialog, MockField, MockSelect, highlight } from "../mock";
import { DemoScene, between, fadeIn, progress } from "../timeline";

const NOTES = `Réunion du 28/10 — refonte du site
- Hugo prépare les maquettes de la page tarifs pour vendredi.
- Bug de connexion à corriger en priorité (Sam).
- Léa met à jour la FAQ avant la mise en ligne.`;

const DRAFTS: (SampleTask & { due: string })[] = [
  {
    id: "x1",
    name: "Maquettes de la page tarifs",
    status: TaskStatus.TODO,
    priority: TaskPriority.MEDIUM,
    assignee: "Hugo",
    project: "Site vitrine",
    start: 31,
    day: 31,
    due: "31 oct.",
  },
  {
    id: "x2",
    name: "Corriger le bug de connexion",
    status: TaskStatus.TODO,
    priority: TaskPriority.HIGH,
    assignee: "Sam",
    project: "Site vitrine",
    start: 29,
    day: 29,
    due: "29 oct.",
  },
  {
    id: "x3",
    name: "Mettre à jour la FAQ",
    status: TaskStatus.TODO,
    priority: TaskPriority.LOW,
    assignee: "Léa",
    project: "Site vitrine",
    start: 30,
    day: 30,
    due: "30 oct.",
  },
];

type MenuEntry =
  | { group: string }
  | { id: string; icon: React.ComponentType<{ className?: string }>; label: string };

const MENU: MenuEntry[] = [
  { group: "Rédiger" },
  { id: "menu-status", icon: FileTextIcon, label: "Point d'avancement" },
  { id: "menu-report", icon: ClipboardListIcon, label: "Bilan de la période" },
  { id: "menu-release", icon: MegaphoneIcon, label: "Notes de version" },
  { group: "Tâches" },
  { id: "menu-extract", icon: TextCursorInputIcon, label: "Créer depuis un texte" },
  { id: "menu-estimate", icon: CalculatorIcon, label: "Estimer les tâches" },
];

const CLICK_MENU = 1100;
const CLICK_EXTRACT = CLICK_MENU + 1400;
const DIALOG = CLICK_EXTRACT + 100;
const PASTE = DIALOG + 1000;
const ANALYZE = PASTE + 1800;
const CLICK_ANALYZE = ANALYZE + 700;
const DRAFTED = CLICK_ANALYZE + 1800;
const DRAFT_GAP = 350;
const CREATE = DRAFTED + 3000;
const CLICK_CREATE = CREATE + 700;
const CREATED = CLICK_CREATE + 600;
const CLICK_CLOSE = CREATED + 1500;
const CLOSE = CLICK_CLOSE + 100;
const END = CLOSE + 3200;

const DraftRow = ({ draft, visible }: { draft: (typeof DRAFTS)[number]; visible: number }) => (
  <li
    className="flex flex-col gap-2 p-2.5"
    style={{ opacity: visible, transform: `translateY(${(1 - visible) * 6}px)` }}
  >
    <div className="flex items-center gap-2">
      <span className="flex size-4 shrink-0 items-center justify-center rounded border border-primary bg-primary text-primary-foreground">
        <CheckIcon className="size-3" />
      </span>
      <span className="flex h-7 flex-1 items-center rounded-md border px-2 text-xs font-medium">
        {draft.name}
      </span>
      <Trash2Icon className="size-3.5 text-muted-foreground" />
    </div>
    <div className="grid grid-cols-3 gap-2 pl-6">
      <MockSelect
        value={
          <>
            <MiniAvatar name={draft.assignee} />
            {draft.assignee}
          </>
        }
      />
      <MockSelect
        value={
          <span className={TASK_PRIORITY_CONFIG[draft.priority].text}>
            Priorité {TASK_PRIORITY_CONFIG[draft.priority].label.toLowerCase()}
          </span>
        }
      />
      <MockSelect
        value={
          <>
            <CalendarIcon className="size-3.5 text-muted-foreground" />
            {draft.due}
          </>
        }
      />
    </div>
  </li>
);

export const aiFromTextScene: DemoScene = {
  id: "ai-from-text",
  title: "Créer des tâches depuis un texte",
  duration: END,
  steps: [
    { at: 0, label: "Ouvrez le menu Assistant, puis Créer depuis un texte" },
    { at: DIALOG, label: "Collez votre compte rendu de réunion" },
    { at: ANALYZE, label: "Cliquez sur Analyser le texte" },
    { at: DRAFTED, label: "Vérifiez les tâches proposées, puis créez-les" },
    { at: CLOSE, label: "Les tâches sont ajoutées au projet" },
  ],
  keystrokes: [{ at: PASTE - 300, keys: "⌘ V" }],
  clicks: [CLICK_MENU, CLICK_EXTRACT, CLICK_ANALYZE, CLICK_CREATE, CLICK_CLOSE],
  cursor: [
    { at: 0, x: 480, y: 330 },
    { at: 400, target: "btn-assistant" },
    { at: CLICK_MENU + 300, target: "menu-extract" },
    { at: DIALOG + 200, x: 640, y: 470 },
    { at: ANALYZE, target: "btn-analyze" },
    { at: CLICK_ANALYZE + 300, x: 640, y: 470 },
    { at: CREATE, target: "btn-create-all" },
    { at: CREATED + 600, target: "btn-close" },
    { at: CLOSE + 300, x: 620, y: 470 },
  ],
  camera: [
    { at: 0, x: 440, y: 275, zoom: 1 },
    { at: 300, target: "btn-assistant", dx: -60, dy: 60, zoom: 1.6 },
    { at: CLICK_MENU + 100, target: "assistant-menu", dx: -40, zoom: 1.6 },
    { at: DIALOG, x: 440, y: 275, zoom: 1 },
    { at: PASTE - 400, target: "notes", zoom: 1.45 },
    { at: ANALYZE, target: "btn-analyze", dx: -80, zoom: 1.55 },
    { at: DRAFTED, target: "drafts", zoom: 1.3 },
    { at: CREATE, target: "btn-create-all", dx: -80, zoom: 1.5 },
    { at: CREATED, target: "dialog", zoom: 1.5 },
    { at: CLOSE, x: 440, y: 275, zoom: 1 },
    { at: CLOSE + 900, target: "card-x2", zoom: 1.5 },
  ],
  render: (t) => {
    const menuOpen = between(t, CLICK_MENU, CLICK_EXTRACT + 100);
    const dialog = t < CLOSE ? fadeIn(t, DIALOG) : 1 - progress(t, CLOSE, CLOSE + 250);
    const analyzing = between(t, CLICK_ANALYZE, DRAFTED);
    const drafted = between(t, DRAFTED, CREATED);
    const created = t >= CREATED;
    const pasted = t >= PASTE;
    const tasks = t >= CLOSE ? [...DRAFTS, ...SAMPLE_TASKS] : SAMPLE_TASKS;

    const footer = created ? (
      <MockButton demo="btn-close" hover={between(t, CLICK_CLOSE - 300, CLOSE)}>
        Fermer
      </MockButton>
    ) : drafted ? (
      <>
        <MockButton variant="ghost">Modifier le texte</MockButton>
        <MockButton demo="btn-create-all" hover={between(t, CLICK_CREATE - 300, CREATED)}>
          {between(t, CLICK_CREATE, CREATED) && <Loader2Icon className="animate-spin" />}
          Créer 3 tâches
        </MockButton>
      </>
    ) : (
      <>
        <MockButton variant="ghost">Annuler</MockButton>
        <MockButton demo="btn-analyze" hover={between(t, CLICK_ANALYZE - 300, DRAFTED)}>
          {analyzing ? <Loader2Icon className="animate-spin" /> : <SparklesIcon />}
          {analyzing ? "Analyse…" : "Analyser le texte"}
        </MockButton>
      </>
    );

    return (
      <AppFrame
        title="Site vitrine"
        active="Site vitrine"
        overlay={
          <>
            <MockDialog
              demo="dialog"
              title={created ? "3 tâches créées" : "Créer des tâches depuis un texte"}
              description={
                created
                  ? "Elles sont dans Site vitrine."
                  : "Collez un compte rendu de réunion, un e-mail ou des notes : l'assistant en tire les tâches, que vous vérifiez avant de les créer."
              }
              visible={dialog}
              width={created ? 380 : 600}
              footer={footer}
            >
              {created ? (
                <span className="flex items-center gap-2 text-xs text-muted-foreground">
                  <CheckCircle2Icon className="size-4 text-primary" />
                  Les tâches sont dans la colonne À faire.
                </span>
              ) : drafted ? (
                <ul data-demo="drafts" className="flex flex-col divide-y rounded-lg border">
                  {DRAFTS.map((draft, index) => (
                    <DraftRow
                      key={draft.id}
                      draft={draft}
                      visible={fadeIn(t, DRAFTED + index * DRAFT_GAP, 300)}
                    />
                  ))}
                </ul>
              ) : (
                <div className="flex flex-col gap-1.5">
                  <MockField
                    demo="notes"
                    multiline
                    focused={t >= DIALOG && !pasted}
                    value={pasted ? NOTES : ""}
                    placeholder="Ex. : Réunion du 28/10 — Marie s'occupe des maquettes de la page d'accueil pour vendredi…"
                    className="[&>span]:min-h-36"
                  />
                  <span className="text-right text-[11px] text-muted-foreground">
                    {pasted ? NOTES.length : 0} / 20 000
                  </span>
                </div>
              )}
            </MockDialog>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-md bg-green-100 text-xs font-semibold text-green-700 dark:bg-green-500/20 dark:text-green-300">
                S
              </span>
              <span className="text-base font-semibold">Site vitrine</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MockButton
                demo="btn-assistant"
                variant="ghost"
                size="sm"
                hover={between(t, CLICK_MENU - 300, CLICK_EXTRACT + 100)}
              >
                <SparklesIcon />
                Assistant
              </MockButton>
              <MockButton variant="outline" size="sm">
                <SettingsIcon />
                Paramètres
              </MockButton>
            </div>
            {menuOpen && (
              <div
                data-demo="assistant-menu"
                className="absolute top-full right-24 z-20 mt-1 flex w-56 flex-col rounded-lg border bg-popover p-1 shadow-lg"
                style={{ opacity: fadeIn(t, CLICK_MENU, 150) }}
              >
                {MENU.map((item) =>
                  "group" in item ? (
                    <span
                      key={item.group}
                      className="px-2 pt-1.5 pb-1 text-[11px] text-muted-foreground first:pt-1"
                    >
                      {item.group}
                    </span>
                  ) : (
                    <span
                      key={item.id}
                      data-demo={item.id}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs",
                        item.id === "menu-extract" &&
                          between(t, CLICK_MENU + 800, CLICK_EXTRACT + 100) &&
                          "bg-accent",
                      )}
                    >
                      <item.icon className="size-3.5 text-muted-foreground" />
                      {item.label}
                    </span>
                  ),
                )}
              </div>
            )}
          </div>
          <TaskToolbar />
          <MockKanban
            tasks={tasks}
            render={(task) =>
              task.id.startsWith("x") ? (
                <div
                  className="rounded-md"
                  style={highlight(progress(t, CLOSE + 300, CLOSE + 2300))}
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
