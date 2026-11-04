"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { BarChart3Icon, PlayIcon, PlusIcon, SquareIcon, XIcon } from "lucide-react";

import { useGetMembers } from "@/features/members/api/use-get-members";
import { MemberAvatar } from "@/features/members/components/member-avatar";

import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ResponsiveModal } from "@/components/responsive-modal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { useNow } from "../hooks/use-now";
import {
  entrySeconds,
  formatClock,
  formatDuration,
  parseDuration,
  summarizeEntries,
} from "../utils";
import {
  useAddTimeEntry,
  useDeleteTimeEntry,
  useGetTimeEntries,
  useStartTimer,
  useStopTimer,
} from "../api/use-time-entries";
import { MemberDurations } from "./member-durations";
import { TimeReport } from "./time-report";

const VISIBLE_ENTRIES = 5;

interface TaskTimeTrackingProps {
  task: { $id: string; workspaceId: string; projectId: string; sprintId?: string | null };
}

/** Chronomètre, saisie manuelle et temps passé sur une tâche. */
export const TaskTimeTracking = ({ task }: TaskTimeTrackingProps) => {
  const { data, isLoading } = useGetTimeEntries({ taskId: task.$id });
  const { data: members } = useGetMembers({ workspaceId: task.workspaceId });
  const { mutate: start, isPending: isStarting } = useStartTimer();
  const { mutate: stop, isPending: isStopping } = useStopTimer();
  const { mutate: addEntry, isPending: isAdding } = useAddTimeEntry();
  const { mutate: deleteEntry } = useDeleteTimeEntry();

  const [duration, setDuration] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const enabled = data?.enabled === true;
  const running = enabled ? data.running : null;
  const runningHere = running?.taskId === task.$id;
  const now = useNow(runningHere);

  const memberMap = useMemo(
    () => new Map((members?.documents ?? []).map((member) => [member.$id, member])),
    [members],
  );
  const entries = useMemo(() => (enabled ? data.entries : []), [data, enabled]);
  const summary = useMemo(() => summarizeEntries(entries, now), [entries, now]);

  // Collection absente : la fonctionnalité est masquée.
  if (!isLoading && !enabled) return null;

  const minutes = parseDuration(duration);
  const add = () => {
    if (!minutes) return;
    addEntry({ json: { taskId: task.$id, minutes } }, { onSuccess: () => setDuration("") });
  };

  const visible = showAll ? entries : entries.slice(0, VISIBLE_ENTRIES);

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 border-b py-3">
        <CardTitle className="text-sm">Temps passé</CardTitle>
        <div className="flex items-center gap-2">
          {summary.totalSeconds > 0 && (
            <span className="text-xs font-medium text-muted-foreground tabular-nums">
              {formatDuration(summary.totalSeconds)}
            </span>
          )}
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => setIsReportOpen(true)}
            aria-label="Rapport du temps passé"
            title="Rapport du temps passé"
          >
            <BarChart3Icon />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 py-4">
        {isLoading || !enabled ? (
          <Skeleton className="h-9 w-full" />
        ) : (
          <>
            {runningHere && running ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="relative flex size-2.5">
                    <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-60" />
                    <span className="relative inline-flex size-2.5 rounded-full bg-primary" />
                  </span>
                  <span className="text-lg font-semibold tabular-nums">
                    {formatClock(entrySeconds(running, now))}
                  </span>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={isStopping}
                  onClick={() => stop({ json: { workspaceId: task.workspaceId } })}
                >
                  <SquareIcon className="fill-current" />
                  Arrêter
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <Button
                  size="sm"
                  disabled={isStarting}
                  onClick={() => start({ json: { taskId: task.$id } })}
                  className="w-full sm:w-auto sm:self-start"
                >
                  <PlayIcon className="fill-current" />
                  Démarrer le chronomètre
                </Button>
                {running && (
                  <p className="text-xs text-muted-foreground">
                    Chronomètre en cours sur{" "}
                    <Link
                      href={`/workspaces/${task.workspaceId}/tasks/${running.taskId}`}
                      className="font-medium text-foreground hover:underline"
                    >
                      « {running.taskName ?? "une autre tâche"} »
                    </Link>{" "}
                    : il s&apos;arrêtera.
                  </p>
                )}
              </div>
            )}

            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                add();
              }}
            >
              <Input
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
                placeholder="Temps passé : 45m, 1h30…"
                aria-label="Temps à ajouter"
                aria-invalid={duration.trim() !== "" && !minutes}
                className="h-8"
              />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                disabled={!minutes || isAdding}
                className="shrink-0"
              >
                <PlusIcon />
                Ajouter
              </Button>
            </form>

            {summary.byMember.length > 0 && (
              <MemberDurations byMember={summary.byMember} members={memberMap} />
            )}

            {entries.length > 0 && (
              <div className="flex flex-col gap-1">
                <p className="text-xs font-medium text-muted-foreground">Historique</p>
                <ul className="flex flex-col">
                  {visible.map((entry) => {
                    const member = memberMap.get(entry.memberId);
                    const mine = entry.memberId === data.memberId;
                    return (
                      <li
                        key={entry.$id}
                        className="group flex min-h-8 items-center gap-2 rounded-md px-1 text-sm hover:bg-muted/60"
                      >
                        <MemberAvatar
                          name={member?.name}
                          image={member?.avatarUrl}
                          className="size-5"
                        />
                        <span className="min-w-0 flex-1 truncate text-muted-foreground">
                          {format(new Date(entry.startedAt), "d MMM, HH:mm", { locale: fr })}
                        </span>
                        <span
                          className={cn(
                            "shrink-0 tabular-nums",
                            !entry.endedAt && "font-medium text-primary",
                          )}
                        >
                          {entry.endedAt
                            ? formatDuration(entrySeconds(entry))
                            : `${formatDuration(entrySeconds(entry, now))} · en cours`}
                        </span>
                        {mine && entry.endedAt && (
                          <Button
                            size="icon-sm"
                            variant="ghost"
                            className="size-7 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                            aria-label="Supprimer ce temps"
                            onClick={() => deleteEntry({ param: { entryId: entry.$id } })}
                          >
                            <XIcon />
                          </Button>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {entries.length > VISIBLE_ENTRIES && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="self-start text-xs"
                    onClick={() => setShowAll((value) => !value)}
                  >
                    {showAll ? "Voir moins" : `Voir tout (${entries.length})`}
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>

      <ResponsiveModal
        open={isReportOpen}
        onopenchange={setIsReportOpen}
        title="Temps passé par membre"
      >
        <div className="flex flex-col gap-4 p-6">
          <h2 className="text-lg font-semibold">Temps passé par membre</h2>
          <TimeReport
            workspaceId={task.workspaceId}
            projectId={task.projectId}
            sprintId={task.sprintId}
          />
        </div>
      </ResponsiveModal>
    </Card>
  );
};
