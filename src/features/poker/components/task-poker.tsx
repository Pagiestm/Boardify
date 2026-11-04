"use client";

import { useMemo } from "react";
import { CheckIcon, EyeIcon, RotateCcwIcon, SpadeIcon, XIcon } from "lucide-react";

import { useUpdateTask } from "@/features/tasks/api/use-update-task";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { MemberAvatar } from "@/features/members/components/member-avatar";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { POKER_VALUES, summarizeVotes } from "../utils";
import { useGetPoker, usePokerAction, usePokerVote } from "../api/use-poker";

interface TaskPokerProps {
  task: { $id: string; workspaceId: string; estimate?: number | null };
}

const points = (value: number) => `${value} point${value > 1 ? "s" : ""}`;

/** Planning poker en direct : chacun vote, les cartes se révèlent ensemble. */
export const TaskPoker = ({ task }: TaskPokerProps) => {
  const { data, isLoading } = useGetPoker({ taskId: task.$id });
  const { data: members } = useGetMembers({ workspaceId: task.workspaceId });
  const { mutate: act, isPending: isActing } = usePokerAction();
  const { mutate: vote, isPending: isVoting } = usePokerVote();
  const { mutate: updateTask, isPending: isApplying } = useUpdateTask();

  const memberMap = useMemo(
    () => new Map((members?.documents ?? []).map((member) => [member.$id, member])),
    [members],
  );

  // Collection absente : la fonctionnalité est masquée.
  if (!isLoading && !data?.enabled) return null;

  const session = data?.enabled ? data.session : null;
  const votes = data?.enabled ? data.votes : [];
  const myVote = data?.enabled ? votes.find((entry) => entry.memberId === data.memberId) : null;
  const summary = session?.revealed ? summarizeVotes(votes.map((entry) => entry.value)) : null;
  const run = (action: "start" | "reveal" | "round" | "end") => act({ taskId: task.$id, action });

  const apply = (value: number) =>
    updateTask(
      { param: { taskId: task.$id }, json: { estimate: value } },
      { onSuccess: () => run("end") },
    );

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-center justify-between gap-2 border-b py-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          Estimation
          {session && (
            <Badge variant="outline" className="font-normal">
              Tour {session.round}
            </Badge>
          )}
        </CardTitle>
        {session && (
          <Button
            size="icon-sm"
            variant="ghost"
            onClick={() => run("end")}
            disabled={isActing}
            aria-label="Terminer l'estimation"
            title="Terminer l'estimation"
          >
            <XIcon />
          </Button>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4 py-4">
        {isLoading || !data?.enabled ? (
          <Skeleton className="h-9 w-full" />
        ) : !session ? (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">
              {task.estimate != null
                ? `Estimée à ${points(task.estimate)}. `
                : "Pas encore estimée. "}
              Estimez-la à plusieurs, en direct : chacun vote, puis les cartes se révèlent ensemble.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto sm:self-start"
              disabled={isActing}
              onClick={() => run("start")}
            >
              <SpadeIcon />
              Lancer le planning poker
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex flex-wrap gap-2" aria-label="Votes">
              {votes.length === 0 && (
                <li className="text-sm text-muted-foreground">En attente des votes…</li>
              )}
              {votes.map((entry) => {
                const member = memberMap.get(entry.memberId);
                return (
                  <li
                    key={entry.memberId}
                    className="flex items-center gap-1.5 rounded-full border bg-muted/40 py-0.5 pr-2.5 pl-0.5 text-xs"
                  >
                    <MemberAvatar
                      name={member?.name}
                      image={member?.avatarUrl}
                      className="size-5"
                    />
                    <span className="max-w-24 truncate">{member?.name ?? "Membre"}</span>
                    {session.revealed ? (
                      <span className="font-semibold tabular-nums">{entry.value}</span>
                    ) : (
                      <CheckIcon className="size-3.5 text-primary" aria-label="a voté" />
                    )}
                  </li>
                );
              })}
            </ul>

            {!session.revealed ? (
              <>
                <div className="grid grid-cols-5 gap-2 sm:grid-cols-9 lg:grid-cols-5 xl:grid-cols-9">
                  {POKER_VALUES.map((value) => (
                    <button
                      key={value}
                      type="button"
                      disabled={isVoting}
                      onClick={() => vote({ taskId: task.$id, value })}
                      aria-pressed={myVote?.value === value}
                      className={cn(
                        "flex h-11 items-center justify-center rounded-md border bg-card text-sm font-semibold tabular-nums shadow-xs transition-all hover:-translate-y-0.5 hover:border-primary/60 disabled:opacity-60 sm:h-14",
                        myVote?.value === value &&
                          "-translate-y-0.5 border-primary bg-primary text-primary-foreground",
                      )}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="w-full sm:w-auto sm:self-start"
                  disabled={isActing || votes.length === 0}
                  onClick={() => run("reveal")}
                >
                  <EyeIcon />
                  Révéler les cartes
                </Button>
              </>
            ) : (
              <>
                {summary ? (
                  <div className="flex flex-col gap-1 rounded-lg border bg-muted/30 px-3 py-2 text-sm">
                    <p>
                      {summary.consensus ? (
                        <span className="font-medium text-primary">
                          Tout le monde est d&apos;accord
                        </span>
                      ) : (
                        <>
                          Moyenne <span className="font-semibold">{summary.average}</span>, de{" "}
                          {summary.min} à {summary.max}
                        </>
                      )}
                    </p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Aucun vote chiffré.</p>
                )}
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  {summary && (
                    <Button
                      size="sm"
                      disabled={isApplying}
                      onClick={() => apply(summary.suggested)}
                    >
                      <CheckIcon />
                      Appliquer {points(summary.suggested)}
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isActing}
                    onClick={() => run("round")}
                  >
                    <RotateCcwIcon />
                    Nouveau tour
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};
