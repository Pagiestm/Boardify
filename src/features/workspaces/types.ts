import type { BaseDocument } from "@/lib/db/types";

export type Workspace = BaseDocument & {
  name: string;
  imageUrl: string;
  inviteCode: string;
  userId: string;
  githubInstallationId?: string;
};
