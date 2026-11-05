import { CheckIcon, EyeIcon, RotateCcwIcon, SpadeIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { MiniAvatar } from "@/components/landing/preview-data";
import { POKER_VALUES } from "@/features/poker/utils";

import { MockButton, MockToast, highlight } from "../mock";
import { DemoScene, between, fadeIn, progress } from "../timeline";
import { DetailsCard, SideCard, TaskPageFrame } from "./task-page";
import { tween } from "../timeline";

const SUGGESTED = 5;

const START = 900;
const CLICK_START = 1500;
const SESSION = 1600;
const MY_VOTE = 2400;
const CLICK_MY_VOTE = 3100;
const HUGO = 4200;
const SAM = 5300;
const REVEAL = 6000;
const CLICK_REVEAL = 6800;
const REVEALED = 6900;
const APPLY = 8400;
const CLICK_APPLY = 9200;
const APPLIED = 9300;
const END = APPLIED + 3600;

/** Votes du tour, dans l'ordre d'arrivée ; la valeur des autres reste cachée avant la révélation. */
const VOTES = [
  { member: "Léa", value: "5", at: CLICK_MY_VOTE, mine: true },
  { member: "Hugo", value: "5", at: HUGO, mine: false },
  { member: "Sam", value: "8", at: SAM, mine: false },
];

/** Carte « Estimation » : avant la séance, pendant les votes, puis après la révélation. */
const EstimationCard = ({ t }: { t: number }) => {
  const session = between(t, SESSION, APPLIED);
  const revealed = between(t, REVEALED, APPLIED);
  const votes = VOTES.filter((vote) => t >= vote.at);
  const myVote = t >= CLICK_MY_VOTE ? "5" : null;

  return (
    <SideCard
      demo="card-estimation"
      title={
        <>
          Estimation
          {session && (
            <Badge variant="outline" className="font-normal">
              Tour 1
            </Badge>
          )}
        </>
      }
    >
      {!session ? (
        <div
          className="flex flex-col gap-2.5"
          style={{ opacity: t >= APPLIED ? fadeIn(t, APPLIED) : 1 }}
        >
          <p className="text-xs leading-relaxed text-muted-foreground">
            {t >= APPLIED ? "Estimée à 5 points. " : "Pas encore estimée. "}
            Estimez-la à plusieurs, en direct : chacun vote, puis les cartes se révèlent ensemble.
          </p>
          <MockButton
            demo="btn-start-poker"
            variant="outline"
            size="sm"
            className="self-start"
            hover={between(t, START + 400, SESSION)}
          >
            <SpadeIcon />
            Lancer le planning poker
          </MockButton>
        </div>
      ) : (
        <>
          <ul className="flex min-h-7 flex-wrap items-center gap-1.5">
            {votes.length === 0 && (
              <li className="text-xs text-muted-foreground">En attente des votes…</li>
            )}
            {votes.map((vote) => (
              <li
                key={vote.member}
                className="flex items-center gap-1.5 rounded-full border bg-muted/40 py-0.5 pr-2.5 pl-0.5 text-[11px]"
                style={highlight(progress(t, vote.at, vote.at + 700))}
              >
                <MiniAvatar name={vote.member} className="size-4 text-[9px]" />
                <span>{vote.member}</span>
                {revealed || vote.mine ? (
                  <span className="font-semibold tabular-nums">{vote.value}</span>
                ) : (
                  <CheckIcon className="size-3 text-primary" />
                )}
              </li>
            ))}
          </ul>

          {!revealed ? (
            <>
              <div className="grid grid-cols-5 gap-1.5">
                {POKER_VALUES.map((value) => (
                  <span
                    key={value}
                    data-demo={`card-${value}`}
                    className={cn(
                      "flex h-10 items-center justify-center rounded-md border bg-card text-xs font-semibold tabular-nums shadow-xs",
                      myVote === value &&
                        "-translate-y-0.5 border-primary bg-primary text-primary-foreground",
                    )}
                  >
                    {value}
                  </span>
                ))}
              </div>
              <MockButton
                demo="btn-reveal"
                size="sm"
                className="self-start"
                hover={between(t, REVEAL + 400, REVEALED)}
              >
                <EyeIcon />
                Révéler les cartes
              </MockButton>
            </>
          ) : (
            <>
              <p
                className="rounded-lg border bg-muted/30 px-2.5 py-1.5 text-xs"
                style={highlight(progress(t, REVEALED, REVEALED + 900))}
              >
                Moyenne <span className="font-semibold">6</span>, de 5 à 8
              </p>
              <div className="flex flex-wrap gap-1.5">
                <MockButton demo="btn-apply" size="sm" hover={between(t, APPLY + 400, APPLIED)}>
                  <CheckIcon />
                  Appliquer {SUGGESTED} points
                </MockButton>
                <MockButton variant="outline" size="sm">
                  <RotateCcwIcon />
                  Nouveau tour
                </MockButton>
              </div>
            </>
          )}
        </>
      )}
    </SideCard>
  );
};

export const pokerScene: DemoScene = {
  id: "poker",
  title: "Estimer une tâche à plusieurs",
  duration: END,
  steps: [
    { at: 0, label: "Lancez le planning poker" },
    { at: MY_VOTE - 300, label: "Chacun vote en secret" },
    { at: REVEAL - 300, label: "Révélez les cartes ensemble" },
    { at: APPLY - 300, label: "Appliquez l'estimation à la tâche" },
  ],
  clicks: [CLICK_START, CLICK_MY_VOTE, CLICK_REVEAL, CLICK_APPLY],
  cursor: [
    { at: 0, x: 560, y: 420 },
    { at: START, target: "btn-start-poker" },
    { at: MY_VOTE, target: "card-5" },
    { at: REVEAL, target: "btn-reveal" },
    { at: APPLY, target: "btn-apply" },
    { at: APPLIED + 400, x: 700, y: 180, duration: 800 },
  ],
  camera: [
    { at: 0, x: 535, y: 300, zoom: 1.27 },
    { at: 400, target: "card-estimation", dy: -20, zoom: 2.1, duration: 800 },
    { at: SESSION + 200, target: "card-estimation", dy: -10, zoom: 2.1 },
    { at: APPLIED + 200, target: "details-estimate", zoom: 2.1 },
    { at: APPLIED + 1900, x: 535, y: 300, zoom: 1.27, duration: 800 },
  ],
  render: (t) => (
    <TaskPageFrame
      // Légère descente pendant la séance, puis retour sur les détails mis à jour.
      scrollY={
        t < APPLIED
          ? tween(t, SESSION, SESSION + 600, 0, -40)
          : tween(t, APPLIED, APPLIED + 600, -40, 0)
      }
      right={
        <>
          <DetailsCard
            estimate={t >= APPLIED ? SUGGESTED : null}
            highlightEstimate={t >= APPLIED ? progress(t, APPLIED, APPLIED + 1500) : undefined}
          />
          <EstimationCard t={t} />
        </>
      }
      overlay={
        <MockToast visible={between(t, APPLIED, APPLIED + 2600) ? fadeIn(t, APPLIED) : 0}>
          Estimation enregistrée : 5 points
        </MockToast>
      }
    />
  ),
};
