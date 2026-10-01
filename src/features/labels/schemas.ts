import { z } from "zod";

import { LABEL_COLORS } from "./types";

export const createLabelSchema = z.object({
  name: z.string().trim().min(1, "Requis").max(50, "50 caractères maximum"),
  color: z.enum(LABEL_COLORS, { error: "Requis" }),
  workspaceId: z.string().trim().min(1, "Requis"),
});

export const labelFormSchema = createLabelSchema.omit({ workspaceId: true });
