import type { RealtimeTopic } from "@/features/realtime/types";

/** Canal Postgres sur lequel chaque écriture est annoncée (LISTEN / NOTIFY). */
export const CHANGES_CHANNEL = "boardify_changes";

/** Sujet temps réel de chaque table ; les tables absentes ne sont pas annoncées. */
export const TABLE_TOPICS: Record<string, RealtimeTopic> = {
  tasks: "tasks",
  comments: "comments",
  activities: "activities",
  checklist_items: "checklist",
  attachments: "attachments",
  sprints: "sprints",
  projects: "projects",
  members: "members",
  labels: "labels",
  workspaces: "workspaces",
  saved_views: "saved-views",
  task_templates: "templates",
  notifications: "notifications",
  presence: "presence",
  time_entries: "time-entries",
  reminders: "reminders",
  poker_sessions: "poker",
  poker_votes: "poker",
  docs: "docs",
  intake_forms: "intake-forms",
  retro_items: "retro",
};

/** Sujets privés : seul leur destinataire (`userId`) les reçoit. */
export const PRIVATE_TOPICS: RealtimeTopic[] = ["notifications", "reminders"];

/** Changement annoncé : uniquement des identifiants (une notification Postgres fait 8 000 octets au plus). */
export interface ChangePayload {
  topic: RealtimeTopic;
  workspaceId: string;
  taskId?: string;
  userId?: string;
}

const text = (value: unknown) => (typeof value === "string" && value ? value : undefined);

/** Changement à annoncer pour une ligne écrite ; null si elle n'appartient à aucun espace. */
export const changePayload = (
  topic: RealtimeTopic,
  row: Record<string, unknown>,
): ChangePayload | null => {
  // Pour un espace, l'espace concerné est la ligne elle-même.
  const workspaceId = text(topic === "workspaces" ? row.id : row.workspaceId);
  if (!workspaceId) return null;

  const payload: ChangePayload = { topic, workspaceId };
  const taskId = text(row.taskId);
  if (taskId) payload.taskId = taskId;
  // Les notifications et les rappels ne concernent que leur destinataire.
  const userId = PRIVATE_TOPICS.includes(topic) ? text(row.userId) : undefined;
  if (userId) payload.userId = userId;
  return payload;
};
