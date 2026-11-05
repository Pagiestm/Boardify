import { BellPlusIcon, BookmarkIcon, PaperclipIcon, PencilIcon, Trash2Icon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { TaskPriority, TaskStatus } from "@/features/tasks/types";
import { MiniAvatar } from "@/components/landing/preview-data";

import { AppFrame, MockButton, highlight } from "../mock";

/**
 * Page d'une tâche, partagée par les démos du panneau de droite (temps passé, estimation).
 * Seules les cartes utiles à la démo sont rendues : la page réelle défile.
 */

export const TASK_NAME = "Intégrer la page de paiement";
export const PROJECT = "Site vitrine";

interface SideCardProps {
  title: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  demo?: string;
  style?: React.CSSProperties;
}

/** Carte du panneau de droite, comme sur la page d'une tâche. */
export const SideCard = ({ title, action, children, demo, style }: SideCardProps) => (
  <section data-demo={demo} className="rounded-xl border bg-card shadow-xs" style={style}>
    <header className="flex items-center justify-between gap-2 border-b px-3 py-2">
      <span className="flex items-center gap-2 text-xs font-semibold">{title}</span>
      {action}
    </header>
    <div className="flex flex-col gap-2.5 p-3">{children}</div>
  </section>
);

const Row = ({
  label,
  children,
  demo,
  style,
}: {
  label: string;
  children: React.ReactNode;
  demo?: string;
  style?: React.CSSProperties;
}) => (
  <div
    data-demo={demo}
    className="flex items-center justify-between gap-2 rounded px-1 py-0.5 text-xs"
    style={style}
  >
    <span className="text-muted-foreground">{label}</span>
    <span className="flex items-center gap-1.5 font-medium">{children}</span>
  </div>
);

/** Carte « Détails » : l'estimation s'y met à jour à la fin du planning poker. */
export const DetailsCard = ({
  estimate,
  highlightEstimate,
}: {
  estimate?: number | null;
  highlightEstimate?: number;
}) => (
  <SideCard title="Détails">
    <div className="flex flex-col">
      <Row label="Assigné à">
        <MiniAvatar name="Léa" className="size-4 text-[9px]" />
        Léa
      </Row>
      <Row label="Échéance">12 nov. 2026</Row>
      <Row label="Statut">
        <Badge variant={TaskStatus.IN_PROGRESS} dot>
          En cours
        </Badge>
      </Row>
      <Row label="Priorité">
        <Badge variant={TaskPriority.HIGH}>Haute</Badge>
      </Row>
      <Row label="Projet">
        <span className="flex size-4 items-center justify-center rounded bg-green-100 text-[9px] font-semibold text-green-700 dark:bg-green-500/20 dark:text-green-300">
          S
        </span>
        {PROJECT}
      </Row>
      <Row label="Étiquettes">
        <Badge className="bg-violet-500/15 text-violet-700 dark:text-violet-300">paiement</Badge>
      </Row>
      <Row
        label="Estimation"
        demo="details-estimate"
        style={highlightEstimate ? highlight(highlightEstimate) : undefined}
      >
        {estimate != null ? (
          `${estimate} points`
        ) : (
          <span className="font-normal text-muted-foreground">—</span>
        )}
      </Row>
    </div>
  </SideCard>
);

/** Colonne de gauche : description et sous-tâches, inchangées pendant ces démos. */
const TaskBody = () => (
  <div className="flex min-w-0 flex-1 flex-col gap-3">
    <section className="rounded-xl border bg-card p-3 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">Description</p>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <PencilIcon className="size-3" />
          Modifier
        </span>
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
        Brancher le paiement sur la nouvelle page, gérer les erreurs de carte et afficher le
        récapitulatif de commande avant validation.
      </p>
    </section>
    <section className="rounded-xl border bg-card p-3 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">Sous-tâches</p>
        <span className="text-[11px] text-muted-foreground tabular-nums">1/3</span>
      </div>
      <ul className="mt-2 flex flex-col gap-1.5">
        {[
          { label: "Brancher la clé de test", done: true },
          { label: "Gérer les erreurs de carte", done: false },
          { label: "Récapitulatif de commande", done: false },
        ].map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-xs">
            <span
              className={cn(
                "flex size-3.5 items-center justify-center rounded-[4px] border",
                item.done && "border-primary bg-primary",
              )}
            >
              {item.done && (
                <svg viewBox="0 0 10 10" className="size-2.5 text-primary-foreground">
                  <path
                    d="M2 5.2l2 2L8 3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </span>
            <span className={cn(item.done && "text-muted-foreground line-through")}>
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </section>
    <section className="rounded-xl border bg-card p-3 shadow-xs">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold">Pièces jointes</p>
        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <PaperclipIcon className="size-3" />
          Ajouter
        </span>
      </div>
      <p className="mt-1.5 text-[11px] text-muted-foreground">
        Glissez des fichiers ici ou cliquez sur « Ajouter ».
      </p>
    </section>
    <section className="rounded-xl border bg-card p-3 shadow-xs">
      <p className="text-xs font-semibold">Activité</p>
      <ul className="mt-2 flex flex-col gap-1.5 text-[11px] text-muted-foreground">
        <li className="flex items-center gap-2">
          <MiniAvatar name="Léa" className="size-4 text-[9px]" />
          <span className="truncate">
            <span className="font-medium text-foreground">Léa</span> a créé la tâche
          </span>
        </li>
        <li className="flex items-center gap-2">
          <MiniAvatar name="Sam" className="size-4 text-[9px]" />
          <span className="truncate">
            <span className="font-medium text-foreground">Sam</span> a changé le statut
          </span>
        </li>
      </ul>
    </section>
  </div>
);

/** Cadre complet d'une page de tâche ; `right` reçoit les cartes du panneau de droite. */
export const TaskPageFrame = ({
  right,
  overlay,
  scrollY = 0,
}: {
  right: React.ReactNode;
  overlay?: React.ReactNode;
  /** Décalage vertical du contenu, pour simuler le défilement de la page. */
  scrollY?: number;
}) => (
  <AppFrame title="Mes tâches" active={PROJECT} overlay={overlay}>
    <div
      data-demo="task-content"
      className="flex flex-col gap-3"
      style={{ transform: `translateY(${scrollY}px)`, willChange: "transform" }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <span className="flex size-5 items-center justify-center rounded bg-green-100 text-[10px] font-semibold text-green-700 dark:bg-green-500/20 dark:text-green-300">
            S
          </span>
          <span className="text-muted-foreground">{PROJECT}</span>
          <span className="text-muted-foreground">›</span>
          <span className="truncate font-semibold">{TASK_NAME}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <MockButton variant="outline" size="sm">
            <BellPlusIcon />
            Rappel
          </MockButton>
          <MockButton variant="outline" size="sm">
            <BookmarkIcon />
            Modèle
          </MockButton>
          <MockButton variant="outline" size="sm" className="text-destructive">
            <Trash2Icon />
            Supprimer
          </MockButton>
        </div>
      </div>
      <div className="flex gap-3">
        <TaskBody />
        <div className="flex w-[420px] shrink-0 flex-col gap-3">{right}</div>
      </div>
    </div>
  </AppFrame>
);

/** Carte « Estimation » hors séance : présente sur la page, à côté du temps passé. */
export const QuietEstimationCard = ({ estimate }: { estimate?: number | null }) => (
  <SideCard title="Estimation">
    <p className="text-xs leading-relaxed text-muted-foreground">
      {estimate != null ? `Estimée à ${estimate} points. ` : "Pas encore estimée. "}
      Estimez-la à plusieurs, en direct : chacun vote, puis les cartes se révèlent ensemble.
    </p>
    <MockButton variant="outline" size="sm" className="self-start">
      Lancer le planning poker
    </MockButton>
  </SideCard>
);
