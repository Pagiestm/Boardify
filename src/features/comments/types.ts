import type { BaseDocument } from "@/lib/db/types";

export const GITHUB_AUTHOR_PREFIX = "github:";

export type Comment = BaseDocument & {
  workspaceId: string;
  taskId: string;
  memberId: string;
  content: string;
  githubCommentId?: string | null;
};
