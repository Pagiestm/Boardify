import { z } from "zod";
import { TaskStatus, TaskPriority } from "./types";

export const createtaskSchema = z.object({
  name: z.string().trim().min(1, "Requis"),
  status: z.nativeEnum(TaskStatus, { error: "Requis" }),
  workspaceId: z.string().trim().min(1, "Requis"),
  projectId: z.string().trim().min(1, "Requis"),
  dueDate: z
    .union([
      z.coerce
        .date<Date | string>()
        .refine((date) => !isNaN(date.getTime()), { message: "Date invalide" }),
      z.literal(""),
    ])
    .optional(),
  assigneeId: z.string().trim().min(1, "Requis").optional(),
  priority: z.nativeEnum(TaskPriority, { error: "Requis" }),
  description: z.string().optional(),
});

export const taskFormSchema = createtaskSchema.omit({ workspaceId: true });
