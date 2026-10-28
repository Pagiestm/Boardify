import { Models } from "node-appwrite";

export const GITHUB_AUTHOR_PREFIX = "github:";

export type Comment = Models.Document & {
  workspaceId: string;
  taskId: string;
  memberId: string;
  content: string;
  githubCommentId?: string | null;
};
