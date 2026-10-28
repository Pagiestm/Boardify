import { z } from "zod";
import { Models } from "node-appwrite";

import { TaskPriority, TaskRecurrence } from "@/features/tasks/types";

export const templateDataSchema = z.object({
  description: z.string().max(2000).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  labelIds: z.array(z.string()).max(20).optional(),
  recurrence: z.nativeEnum(TaskRecurrence).nullable().optional(),
  checklist: z.array(z.string().trim().min(1).max(500)).max(50).optional(),
});

export type TemplateData = z.infer<typeof templateDataSchema>;

export type TaskTemplate = Models.Document & {
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
