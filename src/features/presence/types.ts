import { BaseDocument } from "@/lib/db/types";

export type PresenceRecord = BaseDocument & {
  workspaceId: string;
  memberId: string;
  location: string;
  seenAt: string;
};
