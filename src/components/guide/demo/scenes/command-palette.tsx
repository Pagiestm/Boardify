import {
  FolderIcon,
  FolderPlusIcon,
  HomeIcon,
  LayoutGridIcon,
  ListChecksIcon,
  LogOutIcon,
  MoonIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  UsersIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Kbd } from "@/components/ui/kbd";
import { SAMPLE_TASKS } from "@/components/landing/preview-data";

import { MockKanban, TaskToolbar } from "./create-task";
import { AppFrame, MockDialog, MockField, highlight } from "../mock";
import { DemoScene, between, fadeIn, progress, typed, typingDuration } from "../timeline";

const PLACEHOLDER = "Rechercher une page, un projet, une action, ou poser une question…";
const QUERY_PROJECT = "app";
const QUERY_ACTION = "nouvelle";

interface PaletteItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  group: string;
  shortcut?: string;
  hint?: string;
}

const ITEMS: PaletteItem[] = [
  { id: "accueil", label: "Accueil", icon: HomeIcon, group: "Navigation" },
  { id: "taches", label: "Mes tâches", icon: ListChecksIcon, group: "Navigation" },
  { id: "parametres", label: "Paramètres", icon: SettingsIcon, group: "Navigation" },
  { id: "membres", label: "Membres", icon: UsersIcon, group: "Navigation" },
  { id: "site", label: "Site vitrine", icon: FolderIcon, group: "Projets" },
  { id: "app", label: "App mobile", icon: FolderIcon, group: "Projets" },
  { id: "tache", label: "Nouvelle tâche", icon: PlusIcon, group: "Actions", shortcut: "N" },
  { id: "projet", label: "Nouveau projet", icon: FolderPlusIcon, group: "Actions", shortcut: "P" },
  { id: "espace", label: "Nouvel espace de travail", icon: LayoutGridIcon, group: "Actions" },
  { id: "theme", label: "Passer au thème sombre", icon: MoonIcon, group: "Actions" },
  { id: "logout", label: "Se déconnecter", icon: LogOutIcon, group: "Actions" },
  {
    id: "equipe",
    label: "Équipe produit",
    icon: LayoutGridIcon,
    group: "Espaces de travail",
    hint: "Actuel",
  },
];

const OPEN_1 = 750;
const DOWN = [2100, 2600, 3100];
const TYPE_1 = 3900;
const ENTER_1 = TYPE_1 + typingDuration(QUERY_PROJECT, 6) + 900;
const NAVIGATE = ENTER_1 + 200;
const OPEN_2 = NAVIGATE + 2300;
const TYPE_2 = OPEN_2 + 600;
const ENTER_2 = TYPE_2 + typingDuration(QUERY_ACTION, 10) + 900;
const CREATE = ENTER_2 + 200;

/** Palette ⌘K : champ de recherche et résultats groupés. */
const Palette = ({
  query,
  selected,
  opacity,
}: {
  query: string;
  selected: string;
  opacity: number;
}) => {
  const items = ITEMS.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  const groups = [...new Set(items.map((item) => item.group))];

  return (
    <div
      className="absolute inset-0 z-30 flex justify-center bg-black/40 pt-14"
      style={{ opacity }}
    >
      <div
        data-demo="palette"
        className="flex h-fit w-[540px] flex-col overflow-hidden rounded-xl border bg-background shadow-2xl"
        style={{ transform: `scale(${0.97 + 0.03 * opacity})` }}
      >
        <div className="flex items-center gap-2 border-b px-3 py-2.5 text-sm">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          {query ? (
            <span>{query}</span>
          ) : (
            <span className="truncate text-muted-foreground">{PLACEHOLDER}</span>
          )}
          {query && <span className="-ml-1.5 inline-block h-4 w-px animate-pulse bg-foreground" />}
        </div>
        <div className="flex flex-col p-1.5">
          {groups.map((group) => (
            <div key={group} className="flex flex-col">
              <span className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">
                {group}
              </span>
              {items
                .filter((item) => item.group === group)
                .map(({ id, label, icon: Icon, shortcut, hint }) => (
                  <span
                    key={id}
                    data-demo={`item-${id}`}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-xs",
                      selected === id && "bg-accent",
                    )}
                  >
                    <Icon className="size-3.5 text-muted-foreground" />
                    <span className="flex-1">
                      {label}
                      {hint && (
                        <span className="ml-2 text-[11px] text-muted-foreground">{hint}</span>
                      )}
                    </span>
                    {shortcut && <Kbd>{shortcut}</Kbd>}
                  </span>
                ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/** Accueil simplifié, page de départ de la démo. */
const HomeContent = () => (
  <div className="grid grid-cols-2 gap-3">
    {["Tâches", "Assignées"].map((title, index) => (
      <div key={title} className="flex flex-col gap-2 rounded-lg border p-3">
        <span className="text-xs text-muted-foreground">{title}</span>
        <span className="text-2xl font-semibold">{index ? 4 : 12}</span>
      </div>
    ))}
    {["Échéances", "Charge par personne"].map((title, index) => (
      <div key={title} className="flex h-44 flex-col gap-3 rounded-lg border p-3">
        <span className="text-xs font-medium">{title}</span>
        <div className="flex flex-1 items-end gap-3 px-2">
          {(index ? [60, 85, 40] : [30, 55, 80, 45]).map((height, bar) => (
            <span
              key={bar}
              className="flex-1 rounded-t bg-primary/25"
              style={{ height: `${height}%` }}
            />
          ))}
        </div>
      </div>
    ))}
  </div>
);

export const commandPaletteScene: DemoScene = {
  id: "command-palette",
  title: "La palette ⌘K",
  duration: CREATE + 2800,
  steps: [
    { at: 0, label: "Appuyez sur ⌘K, depuis n'importe quelle page" },
    { at: DOWN[0] - 200, label: "Naviguez avec les flèches" },
    { at: TYPE_1 - 200, label: "Tapez pour filtrer, puis ↵ pour ouvrir" },
    { at: OPEN_2 - 200, label: "Lancez aussi une action : « Nouvelle tâche »" },
  ],
  keystrokes: [
    { at: 500, keys: "⌘ K" },
    ...DOWN.map((at) => ({ at, keys: "↓", duration: 450 })),
    { at: ENTER_1 - 100, keys: "↵" },
    { at: OPEN_2 - 250, keys: "⌘ K" },
    { at: ENTER_2 - 100, keys: "↵" },
  ],
  cursor: [],
  camera: [
    { at: 0, x: 440, y: 275, zoom: 1 },
    { at: OPEN_1 + 200, target: "palette", dy: -40, zoom: 1.35 },
    { at: TYPE_1 + 300, target: "palette", dy: -120, zoom: 1.6 },
    { at: NAVIGATE, x: 440, y: 275, zoom: 1 },
    { at: NAVIGATE + 700, target: "project-App mobile", dx: 120, dy: 60, zoom: 1.5 },
    { at: OPEN_2 - 200, x: 440, y: 275, zoom: 1 },
    { at: TYPE_2 + 200, target: "palette", dy: -60, zoom: 1.5 },
    { at: CREATE, x: 440, y: 275, zoom: 1 },
    { at: CREATE + 600, target: "create-dialog", zoom: 1.4 },
  ],
  render: (t) => {
    const onProject = t >= NAVIGATE;
    const firstOpen = between(t, OPEN_1, NAVIGATE + 200);
    const secondOpen = between(t, OPEN_2, CREATE + 200);
    const opacity = firstOpen
      ? t < NAVIGATE
        ? fadeIn(t, OPEN_1, 200)
        : 1 - progress(t, NAVIGATE, NAVIGATE + 200)
      : secondOpen
        ? t < CREATE
          ? fadeIn(t, OPEN_2, 200)
          : 1 - progress(t, CREATE, CREATE + 200)
        : 0;
    const query = firstOpen
      ? typed(t, TYPE_1, QUERY_PROJECT, 6)
      : typed(t, TYPE_2, QUERY_ACTION, 10);
    const downs = DOWN.filter((at) => t >= at).length;
    const selected = firstOpen
      ? query
        ? "app"
        : ITEMS[downs].id
      : query.length >= 3
        ? "tache"
        : "accueil";

    return (
      <AppFrame
        title={onProject ? "App mobile" : "Accueil"}
        active={onProject ? "App mobile" : "Accueil"}
        overlay={
          <>
            {opacity > 0 && <Palette query={query} selected={selected} opacity={opacity} />}
            <MockDialog
              demo="create-dialog"
              title="Créer une tâche"
              visible={t >= CREATE ? fadeIn(t, CREATE + 150) : 0}
              width={460}
            >
              <MockField
                label="Nom de la tâche"
                placeholder="Ex. : Préparer la démo client"
                focused
              />
            </MockDialog>
          </>
        }
      >
        {onProject ? (
          <div
            className="flex flex-col gap-3 rounded-lg"
            style={{
              opacity: fadeIn(t, NAVIGATE, 300),
              ...highlight(progress(t, NAVIGATE, NAVIGATE + 1500)),
            }}
          >
            <TaskToolbar />
            <MockKanban tasks={SAMPLE_TASKS.filter((task) => task.project === "App mobile")} />
          </div>
        ) : (
          <HomeContent />
        )}
      </AppFrame>
    );
  },
};
