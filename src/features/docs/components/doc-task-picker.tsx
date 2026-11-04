"use client";

import { useState } from "react";
import { CheckIcon, LinkIcon, XIcon } from "lucide-react";

import { useGetTasks } from "@/features/tasks/api/use-get-tasks";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { DOC_TASKS_MAX } from "../schemas";

interface DocTaskPickerProps {
  workspaceId: string;
  projectId: string;
  value: string[];
  onChange: (taskIds: string[]) => void;
  disabled?: boolean;
}

/** Choix des tâches du projet liées à une page. */
export const DocTaskPicker = ({
  workspaceId,
  projectId,
  value,
  onChange,
  disabled,
}: DocTaskPickerProps) => {
  const [search, setSearch] = useState("");
  const { data } = useGetTasks({ workspaceId, projectId });
  const tasks = data?.documents ?? [];
  const query = search.trim().toLowerCase();
  const visible = query ? tasks.filter((task) => task.name.toLowerCase().includes(query)) : tasks;
  const selected = value
    .map((id) => tasks.find((task) => task.$id === id))
    .filter((task) => task !== undefined);

  const toggle = (taskId: string) =>
    onChange(
      value.includes(taskId)
        ? value.filter((id) => id !== taskId)
        : [...value, taskId].slice(0, DOC_TASKS_MAX),
    );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {selected.map((task) => (
          <span
            key={task.$id}
            className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted/50 py-0.5 pr-1 pl-2 text-xs"
          >
            <span className="truncate">{task.name}</span>
            <button
              type="button"
              onClick={() => toggle(task.$id)}
              disabled={disabled}
              aria-label={`Retirer ${task.name}`}
              className="rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <XIcon className="size-3" />
            </button>
          </span>
        ))}
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="xs" disabled={disabled}>
              <LinkIcon />
              Lier des tâches
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" collisionPadding={12} className="w-80 p-2">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Rechercher une tâche…"
              className="h-8 text-[13px]"
              aria-label="Rechercher une tâche"
            />
            <ul className="mt-2 max-h-64 overflow-y-auto">
              {visible.length === 0 && (
                <li className="px-2 py-6 text-center text-xs text-muted-foreground">
                  Aucune tâche dans ce projet.
                </li>
              )}
              {visible.map((task) => {
                const checked = value.includes(task.$id);
                return (
                  <li key={task.$id}>
                    <button
                      type="button"
                      onClick={() => toggle(task.$id)}
                      className={cn(
                        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-muted",
                        checked && "font-medium",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-4 shrink-0 items-center justify-center rounded border",
                          checked && "border-primary bg-primary text-primary-foreground",
                        )}
                      >
                        {checked && <CheckIcon className="size-3" />}
                      </span>
                      <span className="truncate">{task.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};
