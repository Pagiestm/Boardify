import { z } from "zod";

import { TaskStatus, TaskPriority } from "./types";

export const createtaskSchema = z.object({
    name: z.string().trim().min(1, "Requis"),
    status: z.nativeEnum(TaskStatus, { required_error: "Requis" }),
    workspaceId: z.string().trim().min(1, "Requis"),
    projectId: z.string().trim().min(1, "Requis"),
    dueDate: z.coerce.date(),
    assigneeId: z.string().trim().min(1, "Requis"),
    priority: z.nativeEnum(TaskPriority, { required_error: "Requis" }),
    description: z.string().optional(),
})