import type { BaseDocument } from "@/lib/db/types";

export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;

export type Attachment = BaseDocument & {
  workspaceId: string;
  taskId: string;
  memberId: string;
  fileId: string;
  name: string;
  mimeType?: string | null;
  size: number;
};
