import { MemberAvatar } from "@/features/members/components/member-avatar";

import { formatDuration } from "../utils";

interface MemberDurationsProps {
  byMember: { memberId: string; seconds: number }[];
  members: Map<string, { name: string; avatarUrl?: string | null }>;
}

/** Temps de chaque membre, avec une barre proportionnelle au plus grand. */
export const MemberDurations = ({ byMember, members }: MemberDurationsProps) => {
  const max = Math.max(1, ...byMember.map((item) => item.seconds));

  return (
    <ul className="flex flex-col gap-2">
      {byMember.map(({ memberId, seconds }) => {
        const member = members.get(memberId);
        return (
          <li key={memberId} className="flex items-center gap-2.5 text-sm">
            <MemberAvatar
              name={member?.name ?? "Ancien membre"}
              image={member?.avatarUrl}
              className="size-6"
              fallbackClassName="text-[10px]"
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate">{member?.name ?? "Ancien membre"}</span>
                <span className="shrink-0 text-xs font-medium tabular-nums">
                  {formatDuration(seconds)}
                </span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${(seconds / max) * 100}%` }}
                />
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
};
