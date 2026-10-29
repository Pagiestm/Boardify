"use client";

import Link from "next/link";
import {
  ArrowRightIcon,
  CheckIcon,
  CompassIcon,
  PartyPopperIcon,
  RocketIcon,
  XIcon,
} from "lucide-react";

import { useCurrent } from "@/features/auth/api/use-current";
import { useAssistantStatus } from "@/features/assistant/api/use-assistant";
import { useCreateTaskModal } from "@/features/tasks/hooks/use-create-task-modal";
import { useGetGithubConnection } from "@/features/github/api/use-get-github-connection";
import { useCreateProjectModal } from "@/features/projects/hooks/use-create-project-modal";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCommandPalette } from "@/components/command-palette";

import { markOnboarding, startTour, useOnboardingFlags } from "../store";

interface GettingStartedCardProps {
  workspaceId: string;
  projectCount: number;
  taskCount: number;
  memberCount: number;
}

interface Item {
  id: string;
  title: string;
  description: string;
  done: boolean;
  action: { label: string; onClick?: () => void; href?: string };
}

/** « Premiers pas » : les étapes clés pour bien démarrer, cochées au fil de l'eau. */
export const GettingStartedCard = ({
  workspaceId,
  projectCount,
  taskCount,
  memberCount,
}: GettingStartedCardProps) => {
  const { data: user } = useCurrent();
  const { tours, steps } = useOnboardingFlags(user?.$id);
  const { data: assistant } = useAssistantStatus(workspaceId);
  const { data: github } = useGetGithubConnection({ workspaceId });
  const { open: createProject } = useCreateProjectModal();
  const { open: createTask } = useCreateTaskModal();
  const palette = useCommandPalette();

  const hiddenFlag = `hidden:${workspaceId}`;
  if (!user || steps.includes(hiddenFlag)) return null;

  const settings = `/workspaces/${workspaceId}/settings`;
  const items: Item[] = [
    {
      id: "tour",
      title: "Faire la visite guidée",
      description: "Deux minutes pour découvrir l'interface.",
      done: tours.includes("home"),
      action: { label: "Lancer", onClick: () => startTour("home") },
    },
    {
      id: "project",
      title: "Créer un projet",
      description: "Chaque projet a son Kanban, ses vues et ses sprints.",
      done: projectCount > 0,
      action: { label: "Créer", onClick: createProject },
    },
    {
      id: "task",
      title: "Créer une tâche",
      description: "Appuyez sur N depuis n'importe quelle page.",
      done: taskCount > 0,
      action: { label: "Créer", onClick: () => createTask() },
    },
    {
      id: "invite",
      title: "Inviter un membre",
      description: "Partagez le lien d'invitation de l'espace.",
      done: memberCount > 1,
      action: { label: "Inviter", href: settings },
    },
    {
      id: "palette",
      title: "Essayer la recherche ⌘K",
      description: "Pages, projets et actions au clavier.",
      done: steps.includes("palette"),
      action: { label: "Essayer", onClick: palette.open },
    },
  ];
  if (assistant?.canManage) {
    items.push({
      id: "assistant",
      title: "Brancher l'assistant IA",
      description: "Avec votre propre clé : OpenAI, Claude, Mistral, Gemini…",
      done: Boolean(assistant.configured),
      action: { label: "Configurer", href: settings },
    });
  }
  if (github?.configured && github.canManage) {
    items.push({
      id: "github",
      title: "Connecter GitHub",
      description: "Tâches et issues synchronisées dans les deux sens.",
      done: Boolean(github.connection && !github.broken),
      action: { label: "Connecter", href: settings },
    });
  }

  const doneCount = items.filter((item) => item.done).length;
  const complete = doneCount === items.length;
  const hide = () => markOnboarding(user.$id, hiddenFlag);

  return (
    <Card data-tour="getting-started" className="gap-0 overflow-hidden p-0">
      <div className="flex items-start justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            {complete ? (
              <PartyPopperIcon className="size-4.5" />
            ) : (
              <RocketIcon className="size-4.5" />
            )}
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-semibold">
              {complete ? "Vous êtes prêt !" : "Premiers pas"}
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                {doneCount}/{items.length}
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">
              {complete
                ? "Toutes les étapes sont faites. Le guide reste disponible depuis le menu de votre compte."
                : "Quelques étapes pour bien démarrer avec Boardify."}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={hide}
          aria-label="Masquer les premiers pas"
          className="-mr-2 shrink-0"
        >
          <XIcon />
        </Button>
      </div>
      <div className="mx-5 mb-1 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-[width] duration-500"
          style={{ width: `${(doneCount / items.length) * 100}%` }}
        />
      </div>
      {complete ? (
        <div className="flex flex-wrap gap-2 px-5 pt-3 pb-4">
          <Button size="sm" variant="outline" asChild>
            <Link href="/guide">
              <CompassIcon />
              Ouvrir le guide
            </Link>
          </Button>
          <Button size="sm" onClick={hide}>
            Fermer
          </Button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-x-6 px-3 pt-2 pb-3 sm:grid-cols-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 rounded-md px-2 py-2">
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  item.done ? "border-primary bg-primary text-primary-foreground" : "bg-background",
                )}
              >
                {item.done && <CheckIcon className="size-3" />}
              </span>
              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate text-sm font-medium",
                    item.done && "text-muted-foreground line-through",
                  )}
                >
                  {item.title}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {item.description}
                </span>
              </span>
              {!item.done &&
                (item.action.href ? (
                  <Button size="sm" variant="ghost" asChild className="shrink-0">
                    <Link href={item.action.href}>
                      {item.action.label}
                      <ArrowRightIcon />
                    </Link>
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={item.action.onClick}
                    className="shrink-0"
                  >
                    {item.action.label}
                    <ArrowRightIcon />
                  </Button>
                ))}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
};
