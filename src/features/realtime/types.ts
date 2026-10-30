export type RealtimeTopic =
  | "tasks"
  | "comments"
  | "activities"
  | "checklist"
  | "attachments"
  | "sprints"
  | "projects"
  | "members"
  | "labels"
  | "workspaces"
  | "saved-views"
  | "templates"
  | "notifications";

export interface RealtimeChange {
  topic: RealtimeTopic;
  taskId?: string;
}
