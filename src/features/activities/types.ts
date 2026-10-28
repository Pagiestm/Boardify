import { Models } from "node-appwrite";

export enum ActivityType {
  CREATED = "created",
  STATUS = "status",
  ASSIGNEE = "assignee",
  PRIORITY = "priority",
  DATES = "dates",
  NAME = "name",
  DESCRIPTION = "description",
  LABELS = "labels",
  PROJECT = "project",
  DEPENDENCIES = "dependencies",
  RECURRENCE = "recurrence",
  ATTACHMENT_ADDED = "attachment_added",
  ATTACHMENT_REMOVED = "attachment_removed",
  GITHUB_CLOSED = "github_closed",
  GITHUB_REOPENED = "github_reopened",
  GITHUB_EDITED = "github_edited",
}

export interface ActivityChange {
  from?: string | string[] | null;
  to?: string | string[] | null;
}

export type Activity = Models.Document & {
  workspaceId: string;
  taskId: string;
  memberId?: string | null;
  type: ActivityType;
  data?: string | null;
};
