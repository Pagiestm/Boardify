import {
  CalculatorIcon,
  ClipboardListIcon,
  FlagIcon,
  KeyRoundIcon,
  MessagesSquareIcon,
  SearchIcon,
  SparklesIcon,
  SunIcon,
  TextCursorInputIcon,
  WandSparklesIcon,
  ZapIcon,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { TaskPriority } from "@/features/tasks/types";

import { Reveal } from "./reveal";
import { SectionHeading } from "./section-heading";

const PROVIDERS = ["OpenAI", "Anthropic (Claude)", "Mistral", "Google Gemini", "OpenRouter, Groq…"];

const capabilities = [
  {
    icon: SunIcon,
    title: "Ma journée",
    description: "Chaque matin, les tâches à traiter en priorité, avec la raison de chaque choix.",
  },
  {
    icon: SearchIcon,
    title: "Recherche en langage naturel",
    description:
      "« Ce qui est en retard sur le site web » dans ⌘K, et les bonnes tâches s'affichent.",
  },
  {
    icon: WandSparklesIcon,
    title: "Tâches complétées",
    description:
      "À partir d'un simple titre : description, sous-tâches, priorité et estimation proposées.",
  },
  {
    icon: TextCursorInputIcon,
    title: "Depuis un compte rendu",
    description:
      "Collez des notes de réunion ou un e-mail : les tâches sont créées, dates et assignés compris.",
  },
  {
    icon: ZapIcon,
    title: "Ajout rapide intelligent",
    description:
      "Dans l'application desktop (⌃⌥N), « Appeler le client vendredi, urgent #commercial » remplit tous les champs.",
  },
  {
    icon: MessagesSquareIcon,
    title: "Discussions résumées",
    description: "Décisions, questions ouvertes et prochaines actions, et une réponse suggérée.",
  },
  {
    icon: ClipboardListIcon,
    title: "Bilans et notes de version",
    description:
      "Point d'avancement, bilan de la semaine ou notes de version, prêts à être partagés.",
  },
  {
    icon: FlagIcon,
    title: "Sprints planifiés",
    description:
      "Les tâches du backlog proposées selon l'objectif du sprint et la charge de chacun.",
  },
  {
    icon: CalculatorIcon,
    title: "Estimation en un clic",
    description: "Des points proposés pour toutes les tâches qui n'en ont pas encore.",
  },
];

const PRIORITY_TONE: Record<TaskPriority, string> = {
  [TaskPriority.HIGH]: "text-red-600 dark:text-red-400",
  [TaskPriority.MEDIUM]: "text-amber-600 dark:text-amber-400",
  [TaskPriority.LOW]: "text-zinc-500",
};

const FOCUS = [
  {
    name: "Corriger le bug de connexion",
    reason: "En retard depuis hier et bloque la mise en ligne.",
    priority: TaskPriority.HIGH,
    due: "En retard",
  },
  {
    name: "Maquette de la page tarifs",
    reason: "Échéance demain, priorité haute.",
    priority: TaskPriority.HIGH,
    due: "30 oct.",
  },
  {
    name: "Relire la documentation",
    reason: "Débloque deux tâches de l'équipe.",
    priority: TaskPriority.MEDIUM,
    due: "4 nov.",
  },
];

const AssistantPreview = () => (
  <div aria-hidden className="relative mx-auto w-full max-w-xl select-none">
    <div className="absolute inset-[10%] -z-10 rounded-full bg-primary/20 blur-3xl dark:bg-primary/10" />

    <div className="relative ml-auto flex w-[86%] items-center gap-2 rounded-xl border bg-card px-3.5 py-2.5 text-sm shadow-lg shadow-black/5">
      <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
      <span className="truncate">ce qui est en retard sur le site web</span>
      <span className="ml-auto flex shrink-0 items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
        <SparklesIcon className="size-3" />
        IA
      </span>
    </div>

    <div className="relative z-10 mt-4 w-[92%] rounded-xl border bg-card shadow-xl shadow-black/10">
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <SunIcon className="size-4" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-semibold">Ma journée</p>
          <p className="truncate text-xs text-muted-foreground">
            Trois tâches pour avancer sereinement aujourd&apos;hui.
          </p>
        </div>
      </div>
      <ol className="divide-y">
        {FOCUS.map((task, index) => (
          <li key={task.name} className="flex items-start gap-3 px-4 py-2.5">
            <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-muted text-[11px] font-medium text-muted-foreground">
              {index + 1}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{task.name}</span>
              <span className="block truncate text-xs text-muted-foreground">{task.reason}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end text-[11px]">
              <span className={PRIORITY_TONE[task.priority]}>
                {task.priority === TaskPriority.HIGH ? "Haute" : "Moyenne"}
              </span>
              <span
                className={task.due === "En retard" ? "text-destructive" : "text-muted-foreground"}
              >
                {task.due}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </div>

    <div className="relative -mt-2 ml-auto w-[78%] rounded-xl border bg-card p-3.5 shadow-lg shadow-black/5">
      <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <TextCursorInputIcon className="size-3.5" />
        Depuis le compte rendu de réunion
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <Badge variant={TaskPriority.HIGH}>Préparer la démo · vendredi</Badge>
        <Badge variant="secondary">Envoyer le devis · Sam</Badge>
        <Badge variant="secondary">Mettre à jour la FAQ</Badge>
      </div>
    </div>
  </div>
);

export const AiSection = () => {
  return (
    <section id="ia" className="scroll-mt-14 border-b bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 sm:py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <Reveal className="flex flex-col items-start">
            <p className="flex items-center gap-1.5 text-sm font-medium text-primary">
              <SparklesIcon className="size-4" />
              Assistant IA
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Votre IA, au cœur de vos projets
            </h2>
            <p className="mt-4 text-base text-muted-foreground">
              Branchez l&apos;IA de votre choix : elle prépare vos journées, rédige vos tâches,
              résume les discussions et planifie vos sprints. Vous gardez toujours la main : rien
              n&apos;est créé ni modifié sans votre validation.
            </p>
            <div className="mt-6 flex flex-wrap gap-1.5">
              {PROVIDERS.map((provider) => (
                <span
                  key={provider}
                  className="rounded-md border bg-background px-2 py-1 text-xs font-medium"
                >
                  {provider}
                </span>
              ))}
            </div>
            <p className="mt-6 flex items-start gap-2 text-xs text-muted-foreground">
              <KeyRoundIcon className="mt-0.5 size-3.5 shrink-0" />
              Votre propre clé d&apos;API, chiffrée et jamais réaffichée. Les échanges sont facturés
              directement par votre fournisseur, et l&apos;assistant se désactive en un clic.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <AssistantPreview />
          </Reveal>
        </div>

        <Reveal className="mt-20">
          <SectionHeading
            eyebrow="Ce que fait l'assistant"
            title="Moins de saisie, plus d'avancement"
          />
        </Reveal>
        <div className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
          {capabilities.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={(index % 3) * 0.05}>
              <div className="flex size-9 items-center justify-center rounded-lg border bg-background">
                <Icon className="size-4.5 text-primary" />
              </div>
              <h3 className="mt-4 text-base font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{description}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
};
