"use client";

import { useState } from "react";
import { fr } from "date-fns/locale";
import { addDays, differenceInCalendarDays, format, startOfDay } from "date-fns";
import { FlagIcon, PencilIcon, PlusIcon, SparklesIcon, Trash2Icon, TrophyIcon } from "lucide-react";

import { PopulatedTask } from "@/features/tasks/types";
import { isTaskDone } from "@/features/tasks/utils";
import { useGetTasks } from "@/features/tasks/api/use-get-tasks";
import { useTaskFilters } from "@/features/tasks/hooks/use-task-filters";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useAssistantReady } from "@/features/assistant/api/use-assistant";
import { SprintPlanDialog } from "@/features/assistant/components/sprint-plan-dialog";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useDeleteSprint, useGetSprints } from "../api/use-sprints";
import { getSprintState, NO_SPRINT, Sprint, SPRINT_STATE_LABELS, SprintState } from "../types";
import { SprintFormDialog, SprintFormValues } from "./sprint-form-dialog";
import { CompleteSprintDialog } from "./complete-sprint-dialog";

const ALL = "all";
const SPRINT_LENGTH_DAYS = 13;

const STATE_STYLES: Record<SprintState, string> = {
  planned: "bg-muted text-muted-foreground",
  active: "bg-primary/10 text-primary",
  late: "bg-amber-500/15 text-amber-700 dark:text-amber-400",
  completed: "bg-muted text-muted-foreground",
};

const formatRange = (sprint: Sprint) =>
  `${format(new Date(sprint.startDate), "d MMM", { locale: fr })} → ${format(
    new Date(sprint.endDate),
    "d MMM",
    { locale: fr },
  )}`;

const remainingLabel = (sprint: Sprint, state: SprintState) => {
  const today = startOfDay(new Date());
  if (state === "planned") {
    const days = differenceInCalendarDays(new Date(sprint.startDate), today);
    return `commence dans ${days} j`;
  }
  if (state === "active") {
    const days = differenceInCalendarDays(new Date(sprint.endDate), today);
    return days === 0 ? "dernier jour" : `${days} j restant${days > 1 ? "s" : ""}`;
  }
  if (state === "late") {
    const days = differenceInCalendarDays(today, new Date(sprint.endDate));
    return `terminé depuis ${days} j`;
  }
  return null;
};

const weight = (task: PopulatedTask) => task.estimate ?? 0;

interface SprintBarProps {
  workspaceId: string;
  projectId: string;
}

type SprintDialog =
  | { kind: "create"; defaults: SprintFormValues }
  | { kind: "edit"; sprint: Sprint }
  | { kind: "complete" }
  | { kind: "plan" };

export const SprintBar = ({ workspaceId, projectId }: SprintBarProps) => {
  const [{ sprintId }, setFilters] = useTaskFilters();
  const [dialog, setDialog] = useState<SprintDialog | null>(null);
  const { data: sprints } = useGetSprints({ projectId });
  const { mutate: deleteSprint } = useDeleteSprint();
  const assistantReady = useAssistantReady(workspaceId);

  const selected = sprints?.find((sprint) => sprint.$id === sprintId);
  const { data: sprintTasks } = useGetTasks({
    workspaceId,
    projectId,
    sprintId: selected?.$id ?? null,
    enabled: Boolean(selected),
  });

  const [DeleteDialog, confirmDelete] = useConfirm(
    "Supprimer le sprint",
    "Ses tâches seront conservées, sans sprint.",
    "destructive",
  );

  const select = (value: string) => setFilters({ sprintId: value === ALL ? null : value });

  const openSprints = (sprints ?? []).filter((sprint) => !sprint.completed);
  const completedSprints = (sprints ?? []).filter((sprint) => sprint.completed).reverse();

  const openCreate = () => {
    const last = sprints?.at(-1);
    const start = last ? addDays(startOfDay(new Date(last.endDate)), 1) : startOfDay(new Date());
    setDialog({
      kind: "create",
      defaults: {
        name: `Sprint ${(sprints?.length ?? 0) + 1}`,
        goal: "",
        startDate: start,
        endDate: addDays(start, SPRINT_LENGTH_DAYS),
      },
    });
  };

  const handleDelete = async () => {
    if (!selected || !(await confirmDelete())) return;
    deleteSprint(selected.$id, { onSuccess: () => select(ALL) });
  };

  const state = selected ? getSprintState(selected) : null;
  const stats = selected?.stats;
  const usePoints = (stats?.points ?? 0) > 0;
  const progress = stats
    ? usePoints
      ? stats.donePoints / stats.points
      : stats.tasks > 0
        ? stats.doneTasks / stats.tasks
        : 0
    : 0;

  const load = new Map<
    string,
    { name: string; image?: string; total: number; open: number; tasks: number }
  >();
  if (selected) {
    for (const task of (sprintTasks?.documents ?? []) as PopulatedTask[]) {
      const key = task.assigneeId;
      const entry = load.get(key) ?? {
        name: task.assignee?.name ?? task.assignee?.email ?? "Non assignée",
        image: task.assignee?.avatarUrl,
        total: 0,
        open: 0,
        tasks: 0,
      };
      const value = usePoints ? weight(task) : 1;
      entry.total += value;
      entry.tasks += 1;
      if (!isTaskDone(task)) entry.open += value;
      load.set(key, entry);
    }
  }
  const loadEntries = [...load.entries()]
    .map(([id, entry]) => ({ id, ...entry }))
    .sort((a, b) => b.open - a.open);
  const maxLoad = Math.max(1, ...loadEntries.map((entry) => entry.total));

  return (
    <section data-tour="sprint-bar" className="rounded-lg border bg-card shadow-xs">
      <DeleteDialog />
      <div className="flex flex-wrap items-center gap-3 p-4">
        <Select
          value={selected ? selected.$id : sprintId === NO_SPRINT ? NO_SPRINT : ALL}
          onValueChange={select}
        >
          <SelectTrigger className="w-full sm:w-60" aria-label="Sprint">
            <FlagIcon className="text-muted-foreground" />
            <SelectValue>
              {selected
                ? selected.name
                : sprintId === NO_SPRINT
                  ? "Sans sprint (backlog)"
                  : "Tous les sprints"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Tous les sprints</SelectItem>
            <SelectItem value={NO_SPRINT}>Sans sprint (backlog)</SelectItem>
            {openSprints.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Sprints</SelectLabel>
                  {openSprints.map((sprint) => (
                    <SelectItem key={sprint.$id} value={sprint.$id}>
                      {sprint.name}
                      <span className="text-xs text-muted-foreground">
                        {SPRINT_STATE_LABELS[getSprintState(sprint)]}
                      </span>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}
            {completedSprints.length > 0 && (
              <>
                <SelectSeparator />
                <SelectGroup>
                  <SelectLabel>Terminés</SelectLabel>
                  {completedSprints.map((sprint) => (
                    <SelectItem key={sprint.$id} value={sprint.$id}>
                      {sprint.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </>
            )}
          </SelectContent>
        </Select>

        {selected && state && (
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <Badge className={STATE_STYLES[state]}>{SPRINT_STATE_LABELS[state]}</Badge>
            <span className="text-muted-foreground">{formatRange(selected)}</span>
            {remainingLabel(selected, state) && (
              <span className="text-muted-foreground">· {remainingLabel(selected, state)}</span>
            )}
          </div>
        )}
        {!sprints?.length && (
          <p className="text-sm text-muted-foreground">
            Découpez le projet en sprints pour suivre ce qui doit être livré et quand.
          </p>
        )}

        <div className="flex w-full flex-wrap gap-2 sm:ml-auto sm:w-auto">
          {selected && !selected.completed && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDialog({ kind: "edit", sprint: selected })}
              >
                <PencilIcon />
                Modifier
              </Button>
              {assistantReady && (
                <Button size="sm" variant="ghost" onClick={() => setDialog({ kind: "plan" })}>
                  <SparklesIcon />
                  Planifier
                </Button>
              )}
              <Button size="sm" variant="outline" onClick={() => setDialog({ kind: "complete" })}>
                <TrophyIcon />
                Terminer
              </Button>
            </>
          )}
          {selected && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              aria-label="Supprimer le sprint"
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon />
            </Button>
          )}
          <Button size="sm" variant={selected ? "ghost" : "outline"} onClick={openCreate}>
            <PlusIcon />
            Nouveau sprint
          </Button>
        </div>
      </div>

      {selected && stats && (
        <div className="grid gap-4 border-t px-4 py-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="flex flex-col gap-2">
            {selected.goal && (
              <p className="text-sm">
                <span className="text-muted-foreground">Objectif : </span>
                {selected.goal}
              </p>
            )}
            <div className="flex items-center gap-3">
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.round(progress * 100)}%` }}
                />
              </div>
              <span className="text-xs font-medium tabular-nums">
                {Math.round(progress * 100)} %
              </span>
            </div>
            <p className="text-xs text-muted-foreground tabular-nums">
              {stats.doneTasks}/{stats.tasks} tâche{stats.tasks > 1 ? "s" : ""}
              {usePoints && ` · ${stats.donePoints}/${stats.points} points`}
            </p>
          </div>
          {loadEntries.length > 0 && (
            <div className="flex flex-col gap-1.5">
              <p className="text-xs font-medium text-muted-foreground">
                Charge restante {usePoints ? "(points)" : "(tâches)"}
              </p>
              {loadEntries.map((entry) => (
                <div key={entry.id} className="flex items-center gap-2 text-xs">
                  <MemberAvatar
                    name={entry.name}
                    image={entry.image}
                    className="size-5"
                    fallbackClassName="text-[9px]"
                  />
                  <span className="w-28 truncate">{entry.name}</span>
                  <div className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-primary/25"
                      style={{ width: `${(entry.total / maxLoad) * 100}%` }}
                    />
                    <div
                      className={cn("absolute inset-y-0 left-0 rounded-full bg-primary")}
                      style={{ width: `${(entry.open / maxLoad) * 100}%` }}
                    />
                  </div>
                  <span className="w-12 text-right tabular-nums">
                    {entry.open}/{entry.total}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {dialog?.kind === "create" && (
        <SprintFormDialog
          projectId={projectId}
          defaultValues={dialog.defaults}
          onClose={() => setDialog(null)}
          onCreated={select}
        />
      )}
      {dialog?.kind === "edit" && (
        <SprintFormDialog
          projectId={projectId}
          sprint={dialog.sprint}
          defaultValues={{
            name: dialog.sprint.name,
            goal: dialog.sprint.goal ?? "",
            startDate: new Date(dialog.sprint.startDate),
            endDate: new Date(dialog.sprint.endDate),
          }}
          onClose={() => setDialog(null)}
        />
      )}
      {dialog?.kind === "plan" && selected && (
        <SprintPlanDialog sprint={selected} onClose={() => setDialog(null)} />
      )}
      {dialog?.kind === "complete" && selected && (
        <CompleteSprintDialog
          sprint={selected}
          targets={openSprints.filter((sprint) => sprint.$id !== selected.$id)}
          onClose={() => setDialog(null)}
        />
      )}
    </section>
  );
};
