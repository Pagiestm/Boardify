"use client";

import { useMemo, useState } from "react";

import { useGetSprints } from "@/features/sprints/api/use-sprints";
import { useGetMembers } from "@/features/members/api/use-get-members";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { formatDuration } from "../utils";
import { useGetTimeReport } from "../api/use-time-entries";
import { MemberDurations } from "./member-durations";

const PERIODS = [
  { value: "days:7", label: "7 derniers jours" },
  { value: "days:30", label: "30 derniers jours" },
  { value: "days:90", label: "3 derniers mois" },
];

interface TimeReportProps {
  workspaceId: string;
  /** Projet dont les sprints sont proposés. */
  projectId?: string | null;
  /** Sprint affiché au départ ; à défaut, les 7 derniers jours. */
  sprintId?: string | null;
}

/** Temps passé par membre, sur une période ou un sprint. */
export const TimeReport = ({ workspaceId, projectId, sprintId }: TimeReportProps) => {
  const [scope, setScope] = useState(sprintId ? `sprint:${sprintId}` : "days:7");
  const [kind, value] = scope.split(":");

  const { data: sprints } = useGetSprints({ projectId });
  const { data: members } = useGetMembers({ workspaceId });
  const { data: report, isLoading } = useGetTimeReport({
    workspaceId,
    sprintId: kind === "sprint" ? value : undefined,
    days: kind === "days" ? Number(value) : undefined,
  });

  const memberMap = useMemo(
    () => new Map((members?.documents ?? []).map((member) => [member.$id, member])),
    [members],
  );

  return (
    <div className="flex flex-col gap-4">
      <Select value={scope} onValueChange={setScope}>
        <SelectTrigger className="w-full sm:w-64" aria-label="Période">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectLabel>Période</SelectLabel>
            {PERIODS.map((period) => (
              <SelectItem key={period.value} value={period.value}>
                {period.label}
              </SelectItem>
            ))}
          </SelectGroup>
          {sprints && sprints.length > 0 && (
            <SelectGroup>
              <SelectLabel>Sprints</SelectLabel>
              {sprints.map((sprint) => (
                <SelectItem key={sprint.$id} value={`sprint:${sprint.$id}`}>
                  {sprint.name}
                </SelectItem>
              ))}
            </SelectGroup>
          )}
        </SelectContent>
      </Select>

      {isLoading || !report ? (
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-10 w-full" />
        </div>
      ) : !report.enabled ? (
        <p className="text-sm text-muted-foreground">Le suivi du temps n&apos;est pas activé.</p>
      ) : report.byMember.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun temps enregistré sur cette période.</p>
      ) : (
        <>
          <p className="text-sm">
            <span className="text-2xl font-semibold tabular-nums">
              {formatDuration(report.totalSeconds)}
            </span>{" "}
            <span className="text-muted-foreground">au total</span>
          </p>
          <MemberDurations byMember={report.byMember} members={memberMap} />
        </>
      )}
    </div>
  );
};
