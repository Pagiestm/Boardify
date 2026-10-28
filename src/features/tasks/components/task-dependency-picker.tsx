"use client";

import { useState } from "react";
import { CheckIcon, LockIcon, PlusIcon, XIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { useGetTasks } from "../api/use-get-tasks";

interface TaskDependencyPickerProps {
  workspaceId: string;
  taskId?: string;
  value: string[];
  onChange: (value: string[]) => void;
}

export const TaskDependencyPicker = ({
  workspaceId,
  taskId,
  value,
  onChange,
}: TaskDependencyPickerProps) => {
  const [search, setSearch] = useState("");
  const { data } = useGetTasks({ workspaceId });

  const tasks = (data?.documents ?? []).filter((task) => task.$id !== taskId);
  const selected = value
    .map((id) => tasks.find((task) => task.$id === id))
    .filter((task) => !!task);
  const matches = tasks
    .filter((task) => task.name.toLowerCase().includes(search.trim().toLowerCase()))
    .slice(0, 30);

  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {selected.map((task) => (
        <span
          key={task.$id}
          className="inline-flex max-w-full items-center gap-1 rounded-md border bg-muted/60 py-0.5 pr-1 pl-2 text-xs"
        >
          <LockIcon className="size-3 shrink-0 text-muted-foreground" />
          <span className="truncate">{task.name}</span>
          <button
            type="button"
            aria-label={`Retirer ${task.name}`}
            className="rounded p-0.5 text-muted-foreground hover:bg-accent hover:text-foreground"
            onClick={() => toggle(task.$id)}
          >
            <XIcon className="size-3" />
          </button>
        </span>
      ))}
      <Popover>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" size="xs">
            <PlusIcon />
            {selected.length > 0 ? "Ajouter" : "Choisir des tâches"}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-72 p-2">
          <Input
            value={search}
            autoFocus
            placeholder="Rechercher une tâche…"
            className="h-8"
            onChange={(event) => setSearch(event.target.value)}
          />
          <ul className="mt-2 max-h-64 overflow-y-auto">
            {matches.length === 0 ? (
              <li className="px-2 py-3 text-center text-xs text-muted-foreground">
                Aucune tâche trouvée.
              </li>
            ) : (
              matches.map((task) => (
                <li key={task.$id}>
                  <button
                    type="button"
                    onClick={() => toggle(task.$id)}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent"
                  >
                    <CheckIcon
                      className={cn(
                        "size-3.5 shrink-0",
                        value.includes(task.$id) ? "text-primary" : "invisible",
                      )}
                    />
                    <span className="truncate">{task.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </PopoverContent>
      </Popover>
    </div>
  );
};
