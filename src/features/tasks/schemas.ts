import { z } from "zod";
import { TaskStatus, TaskPriority } from "./types";

export const createtaskSchema = z.object({
    name: z.string().trim().min(1, "Requis"),
    status: z.nativeEnum(TaskStatus, { required_error: "Requis" }),
    workspaceId: z.string().trim().min(1, "Requis"),
    projectId: z.string().trim().min(1, "Requis"),
    dueDate: z.union([
        z.coerce.date().refine(date => !isNaN(date.getTime()), { message: "Date invalide" }),
        z.literal(""),
    ]).optional(),
    assigneeId: z.string().trim().min(1, "Requis").optional(),
    priority: z.nativeEnum(TaskPriority, { required_error: "Requis" }),
    description: z.string().optional(),
});
