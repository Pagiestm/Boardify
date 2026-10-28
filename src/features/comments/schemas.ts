import { z } from "zod";

export const commentContentSchema = z.string().trim().min(1, "Requis").max(5000);

export const createCommentSchema = z.object({
  taskId: z.string().min(1),
  content: commentContentSchema,
});

export const updateCommentSchema = z.object({
  content: commentContentSchema,
});
