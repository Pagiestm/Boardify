import {
  BookmarkIcon,
  BookmarkPlusIcon,
  CalendarDaysIcon,
  ChevronsUpDownIcon,
  GanttChartIcon,
  PlusIcon,
  SearchIcon,
  TableIcon,
  XIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TaskStatus } from "@/features/tasks/types";
import { TASK_PRIORITY_CONFIG, TASK_STATUS_CONFIG } from "@/features/tasks/constants";
import { MiniAvatar, SAMPLE_TASKS } from "@/components/landing/preview-data";

import { AppFrame, MockButton, MockDialog, MockField, MockToast, highlight } from "../mock";
import { DemoScene, between, fadeIn, progress, typed, typingDuration } from "../timeline";

const VIEW_NAME = "Mes tâches";
const MEMBERS = ["Léa", "Hugo", "Sam"];

const OPEN_MEMBERS = 1300;
const PICK_LEA = OPEN_MEMBERS + 1100;
const FILTERED = PICK_LEA + 450;
const VIEWS = FILTERED + 1300;
const OPEN_VIEWS = VIEWS + 700;
const PICK_SAVE = OPEN_VIEWS + 900;
const DIALOG = PICK_SAVE + 100;
const TYPE_NAME = DIALOG + 600;
const SAVE = TYPE_NAME + typingDuration(VIEW_NAME) + 300;
const CLICK_SAVE = SAVE + 700;
const CLOSE = CLICK_SAVE + 100;
const REOPEN = CLOSE + 1000;
const CLICK_REOPEN = REOPEN + 700;

/** Filtre de la barre au-dessus des tâches. */
const FilterPill = ({
  label,
  demo,
  open,
  icon,
}: {
  label: React.ReactNode;
  demo?: string;
  open?: boolean;
  icon?: React.ReactNode;
}) => (
  <span
    data-demo={demo}
    className={cn(
      "flex h-7 items-center gap-1.5 rounded-md border bg-background px-2 text-xs whitespace-nowrap",
      open && "border-ring ring-[3px] ring-ring/30",
    )}
  >
    {icon}
    {label}
    <ChevronsUpDownIcon className="size-3 text-muted-foreground" />
  </span>
);

const Toolbar = ({ viewsOpen }: { viewsOpen: boolean }) => (
  <div className="flex items-center justify-between gap-2">
    <div className="flex rounded-lg bg-muted p-0.5">
      {[
        { label: "Tableau", icon: TableIcon },
        { label: "Calendrier", icon: CalendarDaysIcon },
        { label: "Frise", icon: GanttChartIcon },
      ].map(({ label, icon: Icon }) => (
        <span
          key={label}
          className={cn(
            "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs",
            label === "Tableau" ? "bg-background font-medium shadow-xs" : "text-muted-foreground",
          )}
        >
          <Icon className="size-3.5" />
          {label}
        </span>
      ))}
    </div>
    <div className="flex items-center gap-2">
      <MockButton demo="views-button" variant="outline" size="sm" hover={viewsOpen}>
        <BookmarkIcon />
        Vues
      </MockButton>
      <MockButton size="sm">
        <PlusIcon />
        Nouvelle tâche
      </MockButton>
    </div>
  </div>
);

/** Menu « Vues » : vues enregistrées et enregistrement de la vue actuelle. */
const ViewsMenu = ({ saved, hoverSave, t }: { saved: boolean; hoverSave: boolean; t: number }) => (
  <div className="absolute top-9 right-[118px] z-20 flex w-56 flex-col rounded-lg border bg-popover p-1 text-xs shadow-lg">
    <span className="px-2 py-1.5 text-[11px] font-medium text-muted-foreground">Mes vues</span>
    {saved ? (
      <span
        data-demo="saved-item"
        className="flex items-center gap-2 rounded-md bg-accent px-2 py-1.5"
        style={highlight(progress(t, CLICK_REOPEN, CLICK_REOPEN + 1500))}
      >
        <BookmarkIcon className="size-3.5 text-muted-foreground" />
        <span className="flex-1">{VIEW_NAME}</span>
        <XIcon className="size-3.5 text-muted-foreground" />
      </span>
    ) : (
      <span className="px-2 py-1.5 text-muted-foreground">Aucune vue enregistrée.</span>
    )}
    <span className="my-1 h-px bg-border" />
    <span
      data-demo="save-current"
      className={cn("flex items-center gap-2 rounded-md px-2 py-1.5", hoverSave && "bg-accent")}
    >
      <BookmarkPlusIcon className="size-3.5 text-muted-foreground" />
      Enregistrer la vue actuelle…
    </span>
  </div>
);

export const savedViewScene: DemoScene = {
  id: "saved-view",
  title: "Filtrer et enregistrer une vue",
  duration: CLICK_REOPEN + 3000,
  steps: [
    { at: 0, label: "Filtrez par membre avec « Tous les membres »" },
    { at: VIEWS, label: "Ouvrez « Vues » puis « Enregistrer la vue actuelle… »" },
    { at: DIALOG, label: "Nommez la vue et cliquez sur Enregistrer" },
    { at: REOPEN, label: "Retrouvez-la en un clic dans « Vues »" },
  ],
  clicks: [OPEN_MEMBERS, PICK_LEA, OPEN_VIEWS, PICK_SAVE, CLICK_SAVE, CLICK_REOPEN],
  cursor: [
    { at: 0, x: 620, y: 430 },
    { at: 500, target: "filter-members" },
    { at: OPEN_MEMBERS + 300, target: "member-Léa" },
    { at: FILTERED + 300, x: 600, y: 330 },
    { at: VIEWS, target: "views-button" },
    { at: OPEN_VIEWS + 250, target: "save-current", dx: -30 },
    { at: DIALOG + 900, target: "view-name", dx: 60 },
    { at: SAVE, target: "btn-save" },
    { at: REOPEN, target: "views-button" },
    { at: CLICK_REOPEN + 300, target: "saved-item", dx: -20 },
  ],
  camera: [
    { at: 0, x: 440, y: 275, zoom: 1 },
    { at: 400, target: "filters", dx: 60, dy: 50, zoom: 1.5 },
    { at: FILTERED + 200, x: 440, y: 275, zoom: 1 },
    { at: VIEWS, target: "views-button", dx: -50, dy: 60, zoom: 1.6 },
    { at: DIALOG + 200, target: "view-dialog", zoom: 1.6 },
    { at: CLOSE, x: 440, y: 275, zoom: 1 },
    { at: REOPEN + 300, target: "views-button", dx: -50, dy: 50, zoom: 1.6 },
  ],
  render: (t) => {
    const membersOpen = between(t, OPEN_MEMBERS, PICK_LEA);
    const filtered = t >= PICK_LEA;
    const fade = progress(t, PICK_LEA, FILTERED);
    const rows = SAMPLE_TASKS.filter(
      (task) => !filtered || t < FILTERED || task.assignee === "Léa",
    );
    const count = filtered && t >= FILTERED ? rows.length : SAMPLE_TASKS.length;
    const firstMenu = between(t, OPEN_VIEWS, PICK_SAVE + 100);
    const secondMenu = t >= CLICK_REOPEN;
    const dialog =
      t < CLOSE ? (t >= DIALOG ? fadeIn(t, DIALOG) : 0) : 1 - progress(t, CLOSE, CLOSE + 250);

    return (
      <AppFrame
        title="Mes tâches"
        active="Mes tâches"
        overlay={
          <>
            <MockDialog
              demo="view-dialog"
              title="Enregistrer la vue"
              description="Les filtres et la vue actuels seront enregistrés sous ce nom."
              visible={dialog}
              width={380}
              footer={
                <>
                  <MockButton variant="ghost">Annuler</MockButton>
                  <MockButton demo="btn-save" hover={between(t, SAVE + 600, CLOSE)}>
                    Enregistrer
                  </MockButton>
                </>
              }
            >
              <MockField
                demo="view-name"
                placeholder="Ex. : Mes tâches en retard"
                value={typed(t, TYPE_NAME, VIEW_NAME)}
                focused={between(t, DIALOG, CLICK_SAVE)}
              />
            </MockDialog>
            <MockToast visible={between(t, CLOSE, CLOSE + 2400) ? fadeIn(t, CLOSE) : 0}>
              Vue enregistrée
            </MockToast>
          </>
        }
      >
        <div className="relative flex flex-col gap-3">
          <Toolbar viewsOpen={firstMenu || secondMenu || between(t, VIEWS + 600, OPEN_VIEWS)} />
          {(firstMenu || secondMenu) && (
            <ViewsMenu
              saved={secondMenu}
              hoverSave={between(t, OPEN_VIEWS + 800, PICK_SAVE + 100)}
              t={t}
            />
          )}

          <div data-demo="filters" className="relative flex flex-wrap items-center gap-2">
            <FilterPill label="Tous les statuts" />
            <div className="relative">
              <FilterPill
                demo="filter-members"
                open={membersOpen}
                label={
                  filtered ? (
                    <>
                      <MiniAvatar name="Léa" className="size-4 text-[9px]" />
                      Léa
                    </>
                  ) : (
                    "Tous les membres"
                  )
                }
              />
              {membersOpen && (
                <div className="absolute top-full left-0 z-20 mt-1 flex w-44 flex-col rounded-lg border bg-popover p-1 text-xs shadow-lg">
                  <span className="rounded-md px-2 py-1.5">Tous les membres</span>
                  {MEMBERS.map((member) => (
                    <span
                      key={member}
                      data-demo={`member-${member}`}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1.5",
                        member === "Léa" && t >= OPEN_MEMBERS + 800 && "bg-accent",
                      )}
                    >
                      <MiniAvatar name={member} />
                      {member}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <FilterPill label="Tous les projets" />
            <FilterPill
              label="Échéance"
              icon={<CalendarDaysIcon className="size-3.5 text-muted-foreground" />}
            />
            <span
              className={cn("px-2 text-xs", filtered ? "text-foreground" : "text-muted-foreground")}
            >
              Réinitialiser
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="flex w-56 items-center gap-2 rounded-md border px-2 py-1 text-xs text-muted-foreground">
              <SearchIcon className="size-3.5" />
              Rechercher une tâche…
            </span>
            <span className="text-xs text-muted-foreground">
              {count} tâche{count > 1 ? "s" : ""}
            </span>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <div className="grid grid-cols-[1.8fr_1fr_0.9fr_0.7fr_0.7fr_0.9fr] gap-2 border-b bg-muted/40 px-3 py-2 text-[11px] font-medium text-muted-foreground">
              <span>Tâche</span>
              <span>Projet</span>
              <span>Assigné à</span>
              <span>Échéance</span>
              <span>Priorité</span>
              <span>Statut</span>
            </div>
            {rows.map((task) => {
              const hidden = filtered && task.assignee !== "Léa";
              return (
                <div
                  key={task.id}
                  className="grid grid-cols-[1.8fr_1fr_0.9fr_0.7fr_0.7fr_0.9fr] items-center gap-2 border-b px-3 py-2 text-xs last:border-0"
                  style={{ opacity: hidden ? 1 - fade : 1 }}
                >
                  <span className="truncate font-medium">{task.name}</span>
                  <span className="truncate text-muted-foreground">{task.project}</span>
                  <span className="flex items-center gap-1.5">
                    <MiniAvatar name={task.assignee} />
                    {task.assignee}
                  </span>
                  <span className="text-muted-foreground">{task.day} oct.</span>
                  <span>
                    <Badge variant={task.priority}>
                      {TASK_PRIORITY_CONFIG[task.priority].label}
                    </Badge>
                  </span>
                  <span>
                    <Badge variant={task.status} dot>
                      {TASK_STATUS_CONFIG[task.status as TaskStatus].label}
                    </Badge>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </AppFrame>
    );
  },
};
