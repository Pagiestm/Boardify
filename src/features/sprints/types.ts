import { z } from "zod";
import { Models } from "node-appwrite";

export type Sprint = Models.Document & {
  workspaceId: string;
  projectId: string;
  name: string;
  goal?: string | null;
  startDate: string;
  endDate: string;
  completed?: boolean | null;
};

export type SprintStats = {
  tasks: number;
  doneTasks: number;
  points: number;
  donePoints: number;
};

export type SprintState = "planned" | "active" | "late" | "completed";

export const NO_SPRINT = "none";

const sprintDate = z.coerce
  .date<Date | string>({ error: "Requis" })
  .refine((date) => !isNaN(date.getTime()), { message: "Date invalide" });

export const sprintFormSchema = z
  .object({
    name: z.string().trim().min(1, "Requis").max(100),
    goal: z.string().trim().max(1000).optional(),
    startDate: sprintDate,
    endDate: sprintDate,
  })
  .refine((values) => values.startDate <= values.endDate, {
    message: "Le début doit précéder la fin",
    path: ["startDate"],
  });

export const getSprintState = (sprint: Sprint, now = new Date()): SprintState => {
  if (sprint.completed) return "completed";
  if (new Date(sprint.startDate) > now) return "planned";
  const end = new Date(sprint.endDate);
  end.setHours(23, 59, 59, 999);
  return end < now ? "late" : "active";
};

export const SPRINT_STATE_LABELS: Record<SprintState, string> = {
  planned: "Planifié",
  active: "En cours",
  late: "À clôturer",
  completed: "Terminé",
};
