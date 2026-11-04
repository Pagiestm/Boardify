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
  | "notifications"
  | "presence"
  | "time-entries"
  | "reminders"
  | "poker"
  | "docs"
  | "intake-forms"
  | "retro";

export interface RealtimeChange {
  topic: RealtimeTopic;
  taskId?: string;
}
