import {
  CheckCircle2Icon,
  ChevronsUpDownIcon,
  ExternalLinkIcon,
  MailIcon,
  SparklesIcon,
  WifiIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { Spinner } from "@/components/ui/spinner";
import { LogoMark } from "@/components/brand/logo";
import { TaskPriority } from "@/features/tasks/types";
import { TASK_PRIORITY_CONFIG } from "@/features/tasks/constants";

import { MockButton, MockMenu, highlight } from "../mock";
import {
  DemoScene,
  STAGE_HEIGHT,
  STAGE_WIDTH,
  between,
  fadeIn,
  progress,
  typed,
  typingDuration,
} from "../timeline";

const SENTENCE = "Appeler le client vendredi, urgent #commercial";
const NAME = "Appeler le client";

const KEY = 900;
const OPEN = 1100;
const TYPE = OPEN + 600;
const TYPED = TYPE + typingDuration(SENTENCE);
const INTERPRET = TYPED + 500;
const PARSED = INTERPRET + 1300;
const CREATE = PARSED + 2200;
const CREATED = CREATE + 500;
const CLOSE = CREATED + 1900;
const TRAY = CLOSE + 600;
const TRAY_CLICK = TRAY + 650;
const TRAY_OPEN = TRAY_CLICK + 100;

const DUE_PRESETS = ["Aujourd'hui", "Demain", "Dans 1 semaine"];

const TODAY_TASKS = [
  { name: "Corriger le bug de connexion", late: true },
  { name: "Maquette de la page tarifs" },
  { name: "Relire la documentation" },
];

/** Fenêtre de messagerie en arrière-plan : l'utilisateur travaille dans une autre application. */
const MailWindow = () => (
  <div className="absolute top-[64px] left-[56px] flex h-[400px] w-[600px] flex-col overflow-hidden rounded-xl border bg-background/95 shadow-xl">
    <div className="flex h-9 shrink-0 items-center gap-1.5 border-b bg-muted/60 px-3">
      <span className="size-2.5 rounded-full bg-red-400" />
      <span className="size-2.5 rounded-full bg-amber-400" />
      <span className="size-2.5 rounded-full bg-green-400" />
      <span className="ml-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <MailIcon className="size-3.5" />
        Boîte de réception
      </span>
    </div>
    <div className="flex min-h-0 flex-1">
      <div className="flex w-[200px] flex-col border-r">
        {[
          { from: "Claire Martin", subject: "Point de vendredi", active: true },
          { from: "Hugo", subject: "Maquettes v2" },
          { from: "Facturation", subject: "Votre facture d'octobre" },
        ].map((mail) => (
          <div
            key={mail.subject}
            className={cn("flex flex-col gap-0.5 border-b px-3 py-2.5", mail.active && "bg-accent")}
          >
            <span className="text-xs font-medium">{mail.from}</span>
            <span className="truncate text-[11px] text-muted-foreground">{mail.subject}</span>
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4 text-xs">
        <span className="text-sm font-semibold">Point de vendredi</span>
        <span className="text-muted-foreground">Claire Martin · 9:12</span>
        <p className="leading-relaxed">Bonjour,</p>
        <p className="leading-relaxed">
          Pourriez-vous m&apos;appeler vendredi pour faire le point sur la nouvelle offre ?
          C&apos;est assez urgent de notre côté.
        </p>
        <p className="leading-relaxed">Merci et bonne journée,</p>
        <p className="leading-relaxed">Claire</p>
      </div>
    </div>
  </div>
);

/** Barre des menus du système, avec l'icône de Boardify. */
const MenuBar = ({ trayActive }: { trayActive: boolean }) => (
  <div className="absolute inset-x-0 top-0 z-10 flex h-7 items-center gap-4 bg-background/70 px-4 text-xs backdrop-blur">
    <span className="font-semibold">Mail</span>
    {["Fichier", "Édition", "Présentation", "Fenêtre"].map((item) => (
      <span key={item} className="text-muted-foreground">
        {item}
      </span>
    ))}
    <span className="ml-auto flex items-center gap-3">
      <span
        data-demo="tray"
        className={cn(
          "relative flex size-6 items-center justify-center rounded",
          trayActive && "bg-foreground/15",
        )}
      >
        <LogoMark className="size-4" />
        <span className="absolute -top-0.5 -right-0.5 flex size-3 items-center justify-center rounded-full bg-red-500 text-[8px] font-semibold text-white">
          2
        </span>
      </span>
      <WifiIcon className="size-3.5 text-muted-foreground" />
      <span className="font-medium">mer. 29 oct. 9:41</span>
    </span>
  </div>
);

const Chip = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
  <span
    className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-xs"
    style={style}
  >
    {children}
  </span>
);

/** La fenêtre d'ajout rapide, telle qu'ouverte par ⌃⌥N. */
const QuickAddWindow = ({ t }: { t: number }) => {
  const parsed = t >= PARSED;
  const flash = highlight(progress(t, PARSED, PARSED + 1600));
  const interpreting = between(t, INTERPRET, PARSED);
  const value = parsed ? NAME : typed(t, TYPE, SENTENCE);
  const priority = parsed ? TaskPriority.HIGH : TaskPriority.MEDIUM;

  if (t >= CREATED) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center">
        <CheckCircle2Icon className="size-9 text-primary" />
        <div>
          <p className="font-medium">Tâche créée</p>
          <p className="text-sm text-muted-foreground">{NAME}</p>
        </div>
        <div className="flex gap-2">
          <MockButton variant="outline" size="sm">
            <ExternalLinkIcon />
            Ouvrir
          </MockButton>
          <MockButton variant="ghost" size="sm">
            Nouvelle tâche
          </MockButton>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3">
      <div className="flex items-center gap-2">
        <span data-demo="qa-input" className="flex h-12 min-w-0 flex-1 items-center px-1 text-lg">
          {value ? (
            <span className="truncate">{value}</span>
          ) : (
            <span className="truncate text-muted-foreground">
              Ex. : Appeler le client vendredi, urgent #commercial
            </span>
          )}
          {t < CREATE && (
            <span className="ml-px inline-block h-5 w-px animate-pulse bg-foreground" />
          )}
        </span>
        <MockButton
          demo="qa-interpret"
          variant="ghost"
          size="sm"
          hover={between(t, TYPED + 300, PARSED)}
          className={cn(t < TYPE + 300 && "opacity-50")}
        >
          {interpreting ? <Spinner className="text-current" /> : <SparklesIcon />}
          Interpréter
        </MockButton>
      </div>

      <div data-demo="qa-fields" className="flex flex-col gap-3">
        {parsed && (
          <div className="flex gap-1.5">
            <Chip style={flash}>#commercial</Chip>
          </div>
        )}
        <div className="grid grid-cols-2 gap-2">
          <span className="flex h-8 items-center justify-between rounded-md border px-2.5 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="flex size-4 items-center justify-center rounded bg-green-100 text-[9px] font-semibold text-green-700 dark:bg-green-500/20 dark:text-green-300">
                S
              </span>
              Site vitrine
            </span>
            <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
          </span>
          <span
            className="flex h-8 items-center justify-between rounded-md border px-2.5 text-xs"
            style={flash}
          >
            <span className="flex items-center gap-1.5">
              <span className={cn("size-2 rounded-full", TASK_PRIORITY_CONFIG[priority].dot)} />
              Priorité {TASK_PRIORITY_CONFIG[priority].label.toLowerCase()}
            </span>
            <ChevronsUpDownIcon className="size-3.5 text-muted-foreground" />
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">Échéance</span>
          {DUE_PRESETS.map((preset, index) => (
            <span
              key={preset}
              className={cn(
                "rounded-md px-2 py-1 text-xs",
                !parsed && index === 0 ? "bg-secondary font-medium" : "text-muted-foreground",
              )}
            >
              {preset}
            </span>
          ))}
          <span className="rounded-md border px-2 py-1 text-xs" style={flash}>
            {parsed ? "ven. 31 oct." : "mer. 29 oct."}
          </span>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between gap-3 border-t pt-3">
        <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          <Kbd>↵</Kbd> créer
          <span>·</span>
          <Kbd>Échap</Kbd> fermer
          <span>·</span>
          <Kbd>⌘I</Kbd> interpréter
        </p>
        <MockButton demo="qa-create" size="sm" hover={between(t, CREATE, CREATED)}>
          {between(t, CREATE, CREATED) && <Spinner className="text-current" />}
          Créer la tâche
        </MockButton>
      </div>
    </div>
  );
};

export const quickAddScene: DemoScene = {
  id: "quick-add",
  title: "L'ajout rapide de l'application desktop",
  duration: TRAY_OPEN + 3200,
  steps: [
    { at: 0, label: "Appuyez sur ⌃⌥N depuis n'importe quelle application" },
    { at: TYPE, label: "Tapez la tâche en une phrase" },
    { at: INTERPRET, label: "⌘I : l'assistant remplit les champs" },
    { at: CREATE, label: "Appuyez sur ↵ pour créer la tâche" },
    { at: TRAY, label: "Vos tâches du jour sont dans la barre des menus" },
  ],
  keystrokes: [
    { at: KEY, keys: "⌃ ⌥ N" },
    { at: INTERPRET, keys: "⌘ I" },
    { at: CREATE - 200, keys: "↵" },
  ],
  clicks: [TRAY_CLICK],
  cursor: [
    { at: 0, x: 520, y: 330 },
    { at: TYPED, target: "qa-interpret", dy: 6 },
    { at: CREATE - 400, target: "qa-create", dy: 6 },
    { at: CLOSE, x: 600, y: 300 },
    { at: TRAY, target: "tray", dx: 2, dy: 4 },
  ],
  camera: [
    { at: 0, x: 440, y: 275, zoom: 1 },
    { at: OPEN + 200, target: "qa-window", zoom: 1.5 },
    { at: PARSED, target: "qa-fields", zoom: 1.65 },
    { at: CREATE - 300, target: "qa-window", zoom: 1.5 },
    { at: CLOSE, x: 440, y: 275, zoom: 1 },
    { at: TRAY_OPEN, target: "tray-menu", zoom: 1.6 },
  ],
  render: (t) => {
    const open =
      t < CLOSE ? (t >= OPEN ? fadeIn(t, OPEN, 220) : 0) : 1 - progress(t, CLOSE, CLOSE + 250);
    const trayOpen = t >= TRAY_OPEN;

    return (
      <div
        className="relative overflow-hidden bg-gradient-to-br from-sky-200 via-indigo-100 to-rose-100 text-foreground dark:from-slate-800 dark:via-indigo-950 dark:to-slate-900"
        style={{ width: STAGE_WIDTH, height: STAGE_HEIGHT }}
      >
        <MenuBar trayActive={trayOpen} />
        <MailWindow />

        {open > 0 && (
          <div
            data-demo="qa-window"
            className="absolute top-[118px] left-[200px] z-20 flex h-[300px] w-[480px] flex-col rounded-xl border bg-background p-4 shadow-2xl"
            style={{ opacity: open, transform: `scale(${0.94 + 0.06 * open})` }}
          >
            <QuickAddWindow t={t} />
          </div>
        )}

        {trayOpen && (
          <div
            data-demo="tray-menu"
            className="absolute top-8 right-[150px] z-30 w-64"
            style={{ opacity: fadeIn(t, TRAY_OPEN, 150) }}
          >
            <MockMenu
              highlighted="tray-today"
              items={[
                { id: "tray-open", label: "Ouvrir Boardify" },
                {
                  id: "tray-new",
                  label: (
                    <span className="flex w-full justify-between">
                      Nouvelle tâche…
                      <span className="text-muted-foreground">⌃⌥N</span>
                    </span>
                  ),
                },
                {
                  id: "tray-today",
                  label: <span className="font-medium">À faire aujourd&apos;hui (3)</span>,
                },
                ...TODAY_TASKS.map((task) => ({
                  id: `tray-${task.name}`,
                  label: (
                    <span className="truncate pl-3">
                      {task.name}
                      {task.late && <span className="text-destructive"> · en retard</span>}
                    </span>
                  ),
                })),
                { id: "tray-all", label: "Voir mes tâches…" },
                { id: "tray-update", label: "Rechercher des mises à jour…" },
                { id: "tray-quit", label: "Quitter Boardify" },
              ]}
            />
          </div>
        )}
      </div>
    );
  },
};
