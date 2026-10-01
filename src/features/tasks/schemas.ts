import { z } from "zod";
import { TaskPriority } from "./types";

export const createtaskSchema = z.object({
  name: z.string().trim().min(1, "Requis"),
  status: z.string().trim().min(1, "Requis").max(50),
  workspaceId: z.string().trim().min(1, "Requis"),
  projectId: z.string().trim().min(1, "Requis"),
  dueDate: z.coerce
    .date<Date | string>({ error: "Requis" })
    .refine((date) => !isNaN(date.getTime()), { message: "Date invalide" }),
  assigneeId: z.string({ error: "Requis" }).trim().min(1, "Requis"),
  priority: z.nativeEnum(TaskPriority, { error: "Requis" }),
  description: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
});

export const taskFormSchema = createtaskSchema.omit({ workspaceId: true });
