import { z } from "zod";
import { Models } from "node-appwrite";

export const savedViewFiltersSchema = z.object({
  projectId: z.string().nullable().optional(),
  status: z.string().nullable().optional(),
  assigneeId: z.string().nullable().optional(),
  dueDate: z.string().nullable().optional(),
  labelId: z.string().nullable().optional(),
  sprintId: z.string().nullable().optional(),
});

export type SavedViewFilters = z.infer<typeof savedViewFiltersSchema>;

export type SavedView = Models.Document & {
  workspaceId: string;
  memberId: string;
  name: string;
  view: string;
  filters: string;
};

export const parseSavedViewFilters = (filters: string): SavedViewFilters => {
  try {
    return savedViewFiltersSchema.parse(JSON.parse(filters));
  } catch {
    return {};
  }
};
