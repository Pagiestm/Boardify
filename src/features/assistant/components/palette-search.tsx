"use client";

import { Command } from "cmdk";
import { fr } from "date-fns/locale";
import { format } from "date-fns";
import { useMutation } from "@tanstack/react-query";
import { CircleCheckIcon, CircleIcon, SparklesIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { client } from "@/lib/rpc";
import { Spinner } from "@/components/ui/spinner";

import { useAssistantReady } from "../api/use-assistant";

interface SearchResult {
  summary: string;
  total: number;
  tasks: {
    id: string;
    name: string;
    projectName: string | null;
    status: string;
    done: boolean;
    dueDate: string;
    overdue: boolean;
  }[];
}

const MIN_QUERY_LENGTH = 6;

const itemClasses =
  "flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-2 text-sm select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-muted-foreground";

interface PaletteSearchProps {
  workspaceId: string;
  search: string;
  groupClassName: string;
  onOpenTask: (path: string) => void;
}

/** Recherche de tâches en langage naturel dans la palette ⌘K. */
export const PaletteSearch = ({
  workspaceId,
  search,
  groupClassName,
  onOpenTask,
}: PaletteSearchProps) => {
  const ready = useAssistantReady(workspaceId);
  const { mutate, data, isPending, error, variables, reset } = useMutation({
    mutationFn: async (query: string): Promise<SearchResult> => {
      const response = await client.api.assistant.workspaces[":workspaceId"].search.$post({
        param: { workspaceId },
        json: { query },
      });
      const body = (await response.json().catch(() => null)) as {
        data?: SearchResult;
        error?: string;
      } | null;
      if (!response.ok || !body?.data) throw new Error(body?.error ?? "Recherche impossible");
      return body.data;
    },
  });

  const query = search.trim();
  if (!ready || !workspaceId || query.length < MIN_QUERY_LENGTH) return null;

  const isCurrent = variables === query;
  const result = isCurrent ? data : undefined;

  return (
    <>
      <Command.Group heading="Assistant IA" forceMount className={groupClassName}>
        <Command.Item
          forceMount
          value={`assistant ${query}`}
          onSelect={() => {
            reset();
            mutate(query);
          }}
          className={itemClasses}
        >
          {isPending && isCurrent ? <Spinner /> : <SparklesIcon />}
          <span className="min-w-0 flex-1 truncate">
            {isPending && isCurrent ? (
              "Recherche en cours…"
            ) : (
              <>Demander à l&apos;IA : « {query} »</>
            )}
          </span>
        </Command.Item>
        {isCurrent && error && (
          <p className="px-2 py-1.5 text-xs text-destructive">{error.message}</p>
        )}
      </Command.Group>

      {result && (
        <Command.Group
          heading={`${result.summary} · ${result.total} tâche${result.total > 1 ? "s" : ""}`}
          forceMount
          className={groupClassName}
        >
          {result.tasks.length === 0 ? (
            <p className="px-2 py-3 text-sm text-muted-foreground">Aucune tâche ne correspond.</p>
          ) : (
            result.tasks.map((task) => (
              <Command.Item
                key={task.id}
                forceMount
                value={`resultat ${task.id} ${query}`}
                onSelect={() => onOpenTask(`/workspaces/${workspaceId}/tasks/${task.id}`)}
                className={itemClasses}
              >
                {task.done ? <CircleCheckIcon /> : <CircleIcon />}
                <span className="min-w-0 flex-1 truncate">{task.name}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {task.projectName && `${task.projectName} · `}
                  <span className={cn(task.overdue && "text-destructive")}>
                    {format(new Date(task.dueDate), "d MMM", { locale: fr })}
                  </span>
                </span>
              </Command.Item>
            ))
          )}
          {result.total > result.tasks.length && (
            <p className="px-2 py-1.5 text-xs text-muted-foreground">
              Les {result.tasks.length} premières tâches, par échéance.
            </p>
          )}
        </Command.Group>
      )}
    </>
  );
};
