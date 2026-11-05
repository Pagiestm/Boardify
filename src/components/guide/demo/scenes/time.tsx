import { BarChart3Icon, PlayIcon, PlusIcon, SquareIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { MiniAvatar } from "@/components/landing/preview-data";
import { formatClock, formatDuration } from "@/features/time-tracking/utils";

import { MockButton, MockField, MockToast, highlight } from "../mock";
import { DemoScene, between, fadeIn, progress, typed, typingDuration } from "../timeline";
import { DetailsCard, QuietEstimationCard, SideCard, TaskPageFrame } from "./task-page";

const INPUT = "1h30";
/** Le chronomètre avance plus vite que le temps réel, pour montrer une durée parlante. */
const SPEED = 20;

const START = 800;
const CLICK_START = 1400;
const RUNNING = 1500;
const STOP = 5400;
const CLICK_STOP = 6100;
const STOPPED = 6200;
const FIELD = 6900;
const CLICK_FIELD = 7500;
const TYPE = 7700;
const ADD = TYPE + typingDuration(INPUT) + 400;
const CLICK_ADD = ADD + 700;
const ADDED = CLICK_ADD + 100;
const END = ADDED + 3800;

/** Secondes comptées par le chronomètre à l'instant `t`. */
const runningSeconds = (t: number) =>
  Math.max(0, Math.floor(((Math.min(t, CLICK_STOP) - RUNNING) / 1000) * SPEED));

const MANUAL_SECONDS = 90 * 60;
const HUGO_SECONDS = 135 * 60;

/** Temps de chaque membre à l'instant `t`, du plus grand au plus petit. */
const byMember = (t: number) => {
  const lea = (t >= RUNNING ? runningSeconds(t) : 0) + (t >= ADDED ? MANUAL_SECONDS : 0);
  const members = [
    { name: "Hugo", seconds: HUGO_SECONDS },
    { name: "Léa", seconds: lea },
  ].filter((member) => member.seconds > 0);
  return members.sort((a, b) => b.seconds - a.seconds);
};

/** Historique : chronomètre arrêté, saisie manuelle, puis une entrée plus ancienne. */
const entries = (t: number) => [
  ...(t >= RUNNING
    ? [
        {
          id: "timer",
          member: "Léa",
          label: "5 nov., 14:12",
          seconds: runningSeconds(t),
          running: t < CLICK_STOP,
          at: RUNNING,
        },
      ]
    : []),
  ...(t >= ADDED
    ? [
        {
          id: "manual",
          member: "Léa",
          label: "5 nov., 12:42",
          seconds: MANUAL_SECONDS,
          running: false,
          at: ADDED,
        },
      ]
    : []),
  {
    id: "hugo",
    member: "Hugo",
    label: "4 nov., 16:20",
    seconds: HUGO_SECONDS,
    running: false,
    at: 0,
  },
];

/** Carte « Temps passé » : chronomètre, saisie manuelle, total par membre et historique. */
const TimeCard = ({ t }: { t: number }) => {
  const running = between(t, RUNNING, CLICK_STOP);
  const members = byMember(t);
  const max = Math.max(1, ...members.map((member) => member.seconds));
  const total = members.reduce((sum, member) => sum + member.seconds, 0);

  return (
    <SideCard
      demo="card-time"
      title="Temps passé"
      action={
        <span className="flex items-center gap-1.5">
          {total > 0 && (
            <span
              className="text-[11px] font-medium text-muted-foreground tabular-nums"
              style={t >= ADDED ? highlight(progress(t, ADDED, ADDED + 1500)) : undefined}
            >
              {formatDuration(total)}
            </span>
          )}
          <BarChart3Icon className="size-3.5 text-muted-foreground" />
        </span>
      }
    >
      {running ? (
        <div
          data-demo="timer"
          className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-2.5 py-2"
        >
          <span className="flex items-center gap-2">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
            </span>
            <span className="text-base font-semibold tabular-nums">
              {formatClock(runningSeconds(t))}
            </span>
          </span>
          <MockButton
            demo="btn-stop"
            variant="outline"
            size="sm"
            hover={between(t, STOP + 400, STOPPED)}
          >
            <SquareIcon className="fill-current" />
            Arrêter
          </MockButton>
        </div>
      ) : (
        <MockButton
          demo="btn-start"
          size="sm"
          className="self-start"
          hover={between(t, START + 400, RUNNING)}
        >
          <PlayIcon className="fill-current" />
          Démarrer le chronomètre
        </MockButton>
      )}

      <div className="flex items-end gap-1.5">
        <MockField
          demo="field-duration"
          className="flex-1"
          placeholder="Temps passé : 45m, 1h30…"
          value={t >= ADDED ? "" : typed(t, TYPE, INPUT)}
          focused={between(t, CLICK_FIELD, ADDED)}
        />
        <MockButton demo="btn-add" variant="outline" size="sm" hover={between(t, ADD + 400, ADDED)}>
          <PlusIcon />
          Ajouter
        </MockButton>
      </div>

      {members.length > 0 && (
        <ul className="flex flex-col gap-1.5">
          {members.map((member) => (
            <li key={member.name} className="flex items-center gap-2 text-[11px]">
              <MiniAvatar name={member.name} className="size-4 text-[9px]" />
              <span className="w-8 truncate">{member.name}</span>
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-[width]"
                  style={{ width: `${(member.seconds / max) * 100}%` }}
                />
              </div>
              <span className="w-12 text-right font-medium tabular-nums">
                {formatDuration(member.seconds)}
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-0.5">
        <p className="text-[11px] font-medium text-muted-foreground">Historique</p>
        {entries(t).map((entry) => (
          <div
            key={entry.id}
            className="flex items-center gap-2 rounded px-1 py-0.5 text-[11px]"
            style={entry.at ? highlight(progress(t, entry.at, entry.at + 900)) : undefined}
          >
            <MiniAvatar name={entry.member} className="size-4 text-[9px]" />
            <span className="flex-1 truncate text-muted-foreground">{entry.label}</span>
            <span className={cn("tabular-nums", entry.running && "font-medium text-primary")}>
              {formatDuration(entry.seconds)}
              {entry.running && " · en cours"}
            </span>
          </div>
        ))}
      </div>
    </SideCard>
  );
};

export const timeScene: DemoScene = {
  id: "time",
  title: "Suivre le temps passé",
  duration: END,
  steps: [
    { at: 0, label: "Démarrez le chronomètre" },
    { at: STOP - 300, label: "Arrêtez-le quand vous avez fini" },
    { at: FIELD - 300, label: "Ou saisissez un temps après coup" },
    { at: ADDED, label: "Le temps de chacun s'additionne" },
  ],
  clicks: [CLICK_START, CLICK_STOP, CLICK_FIELD, CLICK_ADD],
  cursor: [
    { at: 0, x: 560, y: 420 },
    { at: START, target: "btn-start" },
    { at: STOP, target: "btn-stop" },
    { at: FIELD, target: "field-duration" },
    { at: ADD, target: "btn-add" },
    { at: ADDED + 400, x: 700, y: 430, duration: 800 },
  ],
  camera: [
    { at: 0, x: 535, y: 300, zoom: 1.27 },
    { at: 400, target: "card-time", dy: -20, zoom: 2.1, duration: 800 },
    { at: STOPPED + 300, target: "card-time", dy: -10, zoom: 2.1 },
    { at: ADDED + 200, target: "card-time", dy: 10, zoom: 2.1 },
    { at: ADDED + 2200, x: 535, y: 300, zoom: 1.27, duration: 800 },
  ],
  render: (t) => (
    <TaskPageFrame
      scrollY={-60}
      right={
        <>
          <DetailsCard estimate={5} />
          <TimeCard t={t} />
          <QuietEstimationCard estimate={5} />
        </>
      }
      overlay={
        <MockToast visible={between(t, ADDED, ADDED + 2400) ? fadeIn(t, ADDED) : 0}>
          1 h 30 ajoutées
        </MockToast>
      }
    />
  ),
};
