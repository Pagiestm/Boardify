import { z } from "zod";

import { RETRO_KINDS } from "./types";

const content = z.string().trim().min(1, "Requis").max(1000, "1 000 caractères au maximum");

export const createRetroItemSchema = z.object({
  sprintId: z.string().min(1),
  kind: z.enum(RETRO_KINDS),
  content,
});

export const updateRetroItemSchema = z
  .object({ kind: z.enum(RETRO_KINDS).optional(), content: content.optional() })
  .refine((values) => values.kind !== undefined || values.content !== undefined, {
    message: "Rien à modifier",
  });

export const retroTaskSchema = z.object({
  /** Membre assigné ; par défaut, la personne qui crée la tâche. */
  assigneeId: z.string().min(1).optional(),
  /** Sprint où placer la tâche ; par défaut, aucun (backlog). */
  sprintId: z.string().min(1).nullable().optional(),
});
