import { unstable_cache, revalidateTag } from "next/cache";

import type { Db } from "@/lib/db";

const MEMBER_TTL = 60;

interface GetMemberProps {
  db: Db;
  workspaceId: string;
  userId: string;
}

const membersTag = (workspaceId: string) => `workspace-members:${workspaceId}`;

export const getMember = ({ db, workspaceId, userId }: GetMemberProps) =>
  unstable_cache(
    async () => (await db.members.first({ where: { workspaceId, userId } })) ?? undefined,
    ["workspace-member", workspaceId, userId],
    { revalidate: MEMBER_TTL, tags: [membersTag(workspaceId)] },
  )();

export const forgetMembers = (workspaceId: string) =>
  revalidateTag(membersTag(workspaceId), { expire: 0 });
