import { z } from "zod";
import { TaskPriority, TaskRecurrence } from "./types";

export const createtaskSchema = z.object({
  name: z.string().trim().min(1, "Requis"),
  status: z.string().trim().min(1, "Requis").max(50),
  workspaceId: z.string().trim().min(1, "Requis"),
  projectId: z.string().trim().min(1, "Requis"),
  dueDate: z.coerce
    .date<Date | string>({ error: "Requis" })
    .refine((date) => !isNaN(date.getTime()), { message: "Date invalide" }),
  startDate: z.coerce
    .date<Date | string>({ error: "Requis" })
    .refine((date) => !isNaN(date.getTime()), { message: "Date invalide" }),
  assigneeId: z.string({ error: "Requis" }).trim().min(1, "Requis"),
  priority: z.nativeEnum(TaskPriority, { error: "Requis" }),
  description: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  blockedBy: z.array(z.string()).max(20).optional(),
  recurrence: z.nativeEnum(TaskRecurrence).nullable().optional(),
  checklist: z.array(z.string().trim().min(1).max(500)).max(50).optional(),
});

export const taskFormSchema = createtaskSchema
  .omit({ workspaceId: true })
  .refine((values) => values.startDate <= values.dueDate, {
    message: "Le début doit précéder l'échéance",
    path: ["startDate"],
  });
