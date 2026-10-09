import { unstable_cache, revalidateTag } from "next/cache";
import { Query, type Databases } from "node-appwrite";

import { DATABASE_ID, MEMBERS_ID } from "@/config";

const MEMBER_TTL = 60;

interface GetMemberProps {
  databases: Databases;
  workspaceId: string;
  userId: string;
}

const membersTag = (workspaceId: string) => `workspace-members:${workspaceId}`;

export const getMember = ({ databases, workspaceId, userId }: GetMemberProps) =>
  unstable_cache(
    async () => {
      const members = await databases.listDocuments(DATABASE_ID, MEMBERS_ID, [
        Query.equal("workspaceId", workspaceId),
        Query.equal("userId", userId),
        Query.limit(1),
      ]);

      return members.documents[0];
    },
    ["workspace-member", workspaceId, userId],
    { revalidate: MEMBER_TTL, tags: [membersTag(workspaceId)] },
  )();

export const forgetMembers = (workspaceId: string) =>
  revalidateTag(membersTag(workspaceId), { expire: 0 });
