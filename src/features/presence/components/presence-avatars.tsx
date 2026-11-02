"use client";

import { usePathname } from "next/navigation";

import { useCurrent } from "@/features/auth/api/use-current";
import { useGetMembers } from "@/features/members/api/use-get-members";
import { MemberAvatar } from "@/features/members/components/member-avatar";
import { useWorkspaceId } from "@/features/workspaces/hooks/use-workspace-id";

import { cn } from "@/lib/utils";

import { usePresence } from "../api/use-presence";

const MAX_AVATARS = 4;

/** Les autres membres qui consultent la même page en ce moment. */
export const PresenceAvatars = ({ className }: { className?: string }) => {
  const workspaceId = useWorkspaceId();
  const pathname = usePathname();
  const { data: user } = useCurrent();
  const { data: presence } = usePresence(workspaceId);
  const { data: members } = useGetMembers({ workspaceId });

  const here = (presence ?? [])
    .filter((entry) => entry.location === pathname)
    .map((entry) => members?.documents.find((member) => member.$id === entry.memberId))
    .filter((member) => member && member.userId !== user?.$id);
  if (here.length === 0) return null;

  const names = here.map((member) => member!.name).join(", ");
  const label =
    here.length === 1
      ? `${names} consulte aussi cette page`
      : `${names} consultent aussi cette page`;

  return (
    <div className={cn("flex items-center gap-2", className)} title={label} aria-label={label}>
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary/60" />
        <span className="relative inline-flex size-2 rounded-full bg-primary" />
      </span>
      <div className="flex -space-x-1.5">
        {here.slice(0, MAX_AVATARS).map((member) => (
          <MemberAvatar
            key={member!.$id}
            name={member!.name}
            image={member!.avatarUrl}
            className="size-6 ring-2 ring-background"
            fallbackClassName="text-[10px]"
          />
        ))}
        {here.length > MAX_AVATARS && (
          <span className="flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium ring-2 ring-background">
            +{here.length - MAX_AVATARS}
          </span>
        )}
      </div>
    </div>
  );
};
