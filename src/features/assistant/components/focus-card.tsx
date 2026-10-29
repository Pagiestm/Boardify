"use client";

import { useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { fr } from "date-fns/locale";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { ArrowRightIcon, CheckIcon, RefreshCwIcon, SparklesIcon, SunIcon } from "lucide-react";

import { useCurrent } from "@/features/auth/api/use-current";
import { TASK_PRIORITY_CONFIG } from "@/features/tasks/constants";
import { PopulatedTask, TaskPriority } from "@/features/tasks/types";
import { isTaskDone } from "@/features/tasks/utils";

import { cn } from "@/lib/utils";
import { client } from "@/lib/rpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

import { useAssistantReady } from "../api/use-assistant";

interface FocusItem {
  id: string;
  name: string;
  projectName: string | null;
  dueDate: string;
  overdue: boolean;
  priority: TaskPriority;
  reason: string;
}

interface FocusPlan {
  intro: string;
  items: FocusItem[];
}

interface SavedPlan {
  day: string;
  generatedAt: string;
  plan: FocusPlan;
}

// La journée préparée est gardée dans le navigateur jusqu'au lendemain.
const STORAGE_EVENT = "boardify:focus";

const subscribe = (onChange: () => void) => {
  window.addEventListener("storage", onChange);
  window.addEventListener(STORAGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(STORAGE_EVENT, onChange);
  };
};

const readStorage = (key: string | null) => {
  if (!key) return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: SavedPlan) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new Event(STORAGE_EVENT));
  } catch {
    // Stockage indisponible : la journée reste affichée jusqu'au rechargement.
  }
};

const todayKey = () => format(new Date(), "yyyy-MM-dd");

interface FocusCardProps {
  workspaceId: string;
  /** Tâches de l'espace, pour afficher l'état à jour des tâches proposées. */
  tasks?: PopulatedTask[];
}

/** « Ma journée » : les tâches à traiter en priorité aujourd'hui, choisies par l'assistant. */
export const FocusCard = ({ workspaceId, tasks }: FocusCardProps) => {
  const ready = useAssistantReady(workspaceId);
  const { data: user } = useCurrent();
  const storageKey = user ? `boardify:focus:${workspaceId}:${user.$id}` : null;

  const raw = useSyncExternalStore(
    subscribe,
    () => readStorage(storageKey),
    () => null,
  );
  const saved = useMemo(() => {
    if (!raw) return null;
    try {
      const value = JSON.parse(raw) as SavedPlan;
      return value.day === todayKey() ? value : null;
    } catch {
      return null;
    }
  }, [raw]);

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      const response = await client.api.assistant.workspaces[":workspaceId"].focus.$post({
        param: { workspaceId },
      });
      const body = (await response.json().catch(() => null)) as {
        data?: FocusPlan;
        error?: string;
      } | null;
      if (!response.ok || !body?.data) {
        throw new Error(body?.error ?? "L'assistant n'a pas pu répondre");
      }
      return body.data;
    },
    onSuccess: (plan) => {
      if (storageKey) {
        writeStorage(storageKey, {
          day: todayKey(),
          generatedAt: new Date().toISOString(),
          plan,
        });
      }
    },
    onError: (error) => toast.error(error.message),
  });

  if (!ready) return null;

  const plan = saved?.plan;
  const taskById = new Map((tasks ?? []).map((task) => [task.$id, task]));
  const items = (plan?.items ?? []).map((item) => {
    const task = taskById.get(item.id);
    return { ...item, name: task?.name ?? item.name, done: task ? isTaskDone(task) : false };
  });
  const doneCount = items.filter((item) => item.done).length;

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <SunIcon className="size-4.5" />
          </span>
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-semibold">
              Ma journée
              {items.length > 0 && (
                <span className="text-xs font-normal text-muted-foreground">
                  {doneCount}/{items.length} terminée{doneCount > 1 ? "s" : ""}
                </span>
              )}
            </h2>
            <p className="text-sm text-muted-foreground">
              {plan?.intro ??
                "L'assistant choisit vos tâches prioritaires du jour : retards, échéances, blocages."}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saved && (
            <span className="text-xs text-muted-foreground">
              Préparée à {format(new Date(saved.generatedAt), "HH'h'mm", { locale: fr })}
            </span>
          )}
          <Button
            size="sm"
            variant={plan ? "ghost" : "primary"}
            onClick={() => mutate()}
            disabled={isPending || !storageKey}
          >
            {isPending ? (
              <Spinner className="text-current" />
            ) : plan ? (
              <RefreshCwIcon />
            ) : (
              <SparklesIcon />
            )}
            {isPending ? "Analyse…" : plan ? "Actualiser" : "Préparer ma journée"}
          </Button>
        </div>
      </div>
      {items.length > 0 && (
        <ol className="divide-y border-t">
          {items.map((item, index) => (
            <li key={item.id}>
              <Link
                href={`/workspaces/${workspaceId}/tasks/${item.id}`}
                className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-xs font-medium",
                    item.done
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {item.done ? <CheckIcon className="size-3" /> : index + 1}
                </span>
                <span className="min-w-0 flex-1 space-y-0.5">
                  <span
                    className={cn(
                      "block truncate text-sm font-medium",
                      item.done && "text-muted-foreground line-through",
                    )}
                  >
                    {item.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">{item.reason}</span>
                </span>
                {!item.done && (
                  <span className="flex shrink-0 flex-col items-end gap-1 text-xs">
                    <span className={cn(TASK_PRIORITY_CONFIG[item.priority]?.text)}>
                      {TASK_PRIORITY_CONFIG[item.priority]?.label}
                    </span>
                    <span
                      className={cn("text-muted-foreground", item.overdue && "text-destructive")}
                    >
                      {item.overdue ? "En retard · " : ""}
                      {format(new Date(item.dueDate), "d MMM", { locale: fr })}
                    </span>
                  </span>
                )}
                <ArrowRightIcon className="mt-0.5 size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
};
