import { z } from "zod";

import { TaskPriority, TaskRecurrence } from "@/features/tasks/types";
import type { BaseDocument } from "@/lib/db/types";

export const templateDataSchema = z.object({
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  labelIds: z.array(z.string()).max(20).optional(),
  recurrence: z.nativeEnum(TaskRecurrence).nullable().optional(),
  estimate: z.number().int().min(0).max(1000).nullable().optional(),
  checklist: z.array(z.string().trim().min(1).max(500)).max(50).optional(),
});

export type TemplateData = z.infer<typeof templateDataSchema>;

export type TaskTemplate = BaseDocument & {
  workspaceId: string;
  name: string;
  data: string;
};

export const parseTemplateData = (data: string): TemplateData => {
  try {
    return templateDataSchema.parse(JSON.parse(data));
  } catch {
    return {};
  }
};
